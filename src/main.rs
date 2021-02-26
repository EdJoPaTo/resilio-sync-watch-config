#![forbid(unsafe_code)]

use std::fs;
use std::process::exit;
use std::thread::sleep;
use std::time::Duration;

use config::resilio::DEFAULT_STORAGE_PATH;
use signal_hook::iterator::Signals;

mod cli;
mod config;
mod parse;
mod resilio;
mod share;

const CONFIGS_FOLDER: &str = ".resilio-sync-watch-config/configs";

fn main() {
    let matches = cli::build().get_matches();

    let basedir = matches
        .value_of("base directory")
        .expect("Base directory could not be read from command line");

    // handle parse subcommand here before the "running" stuff as it has to create folders and so on.
    if let Some(matches) = matches.subcommand_matches("parse") {
        let config_files = matches
            .values_of("config")
            .expect("failed to read config files from command line")
            .collect::<Vec<_>>();

        let raw_merged =
            parse::read_and_merge(&config_files).expect("failed to get and merge all config files");
        let own_config = parse::apply_base_folder(raw_merged, basedir);

        let resilio_config = own_config.into_resilio_config();
        let resilio_config_text = serde_json::to_string_pretty(&resilio_config)
            .expect("failed to parse final resilio config to json");

        println!("{}", resilio_config_text);
        exit(exitcode::OK);
    }

    fs::create_dir_all(basedir).expect("failed to create basedir");
    fs::create_dir_all(DEFAULT_STORAGE_PATH).expect("failed to create working directory");

    let mut resilio = resilio::Resilio::new("rslsync");

    let mut signals = Signals::new(&[nix::libc::SIGINT, nix::libc::SIGTERM])
        .expect("failed to create signal handler");

    match matches.subcommand() {
        ("single", Some(matches)) => {
            println!("Start in single folder mode...");
            let share_secret = get_share_secret_from_arg(matches.value_of("share secret"))
                .expect("Share secret could not be read or is invalid");

            let sync_trash_enabled = matches.is_present("sync trash");

            let mut folder =
                config::resilio::Folder::new(share_secret, format!("{}/single", basedir));
            if !sync_trash_enabled {
                folder.use_sync_trash = Some(false);
            }

            let mut config = config::resilio::Config::default();
            config.shared_folders.push(folder);

            resilio.start(&config);
            println!("Resilio started.");

            loop {
                if let Some(signal) = signals.pending().next() {
                    println!("Received signal {:?}", signal);
                    break;
                }

                if !resilio
                    .is_running()
                    .expect("failed to check if resilio is still running")
                {
                    println!("Resilio stopped unexpectedly!");
                    drop(resilio);
                    exit(exitcode::SOFTWARE);
                }

                sleep(Duration::from_millis(50));
            }
        }
        ("watch", Some(matches)) => {
            println!("Start in watch share mode...");
            let share_secret = get_share_secret_from_arg(matches.value_of("share secret"))
                .expect("Share secret could not be read or is invalid");

            let mut safe_start = false; // TODO: as cli argument
            let mut exits = false;

            loop {
                if exits {
                    break;
                }

                // Ensure the last resilio is stopped before stuff is done.
                resilio.stop().expect("failed to stop resilio");

                if safe_start {
                    let _ = fs::remove_dir_all(CONFIGS_FOLDER);
                    safe_start = false;
                }

                let resilio_config = generate_watch_config(share_secret.to_owned(), basedir);
                resilio.start_unsafe(&resilio_config);
                println!("Resilio started.");

                loop {
                    if let Some(signal) = signals.pending().next() {
                        println!("Received signal {:?}", signal);
                        exits = true;
                        break;
                    }

                    // TODO: check for changed files

                    if !resilio
                        .is_running()
                        .expect("failed to check if resilio is still running")
                    {
                        println!("Resilio stopped unexpectedly! Restart with safe mode...");
                        safe_start = true;
                        break;
                    }

                    sleep(Duration::from_millis(50));
                }
            }
        }
        (command, Some(_)) => todo!("Subcommand '{}' not yet implemented", command),
        _ => unimplemented!("You have to use a subcommand to run this tool"),
    }

    println!("Stop Resilio...");
    match resilio.stop() {
        Ok(resilio::StopKind::NotStarted) => println!("Resilio wasnt started."),
        Ok(resilio::StopKind::StoppedNormally) => println!("Resilio stopped normally."),
        Ok(resilio::StopKind::Killed) => println!("Resilio was killed as it took too long."),
        Err(err) => println!("failed to stop Resilio: {}", err),
    }
}

fn get_share_secret_from_arg(secret_or_file_arg: Option<&str>) -> Option<String> {
    let arg = secret_or_file_arg?;

    let share_secret = if let Ok(content) = fs::read_to_string(arg) {
        content.trim().to_owned()
    } else {
        arg.trim().to_owned()
    };

    if share::is_valid_secret(&share_secret) {
        Some(share_secret)
    } else {
        None
    }
}

fn get_currently_existing_config_file_names(folder: &str) -> Vec<String> {
    match fs::read_dir(folder) {
        Ok(dir_contents) => {
            let mut list = Vec::new();
            for entry in dir_contents {
                if let Ok(entry) = entry {
                    let is_file = entry.file_type().map_or(false, |o| o.is_file());
                    if is_file {
                        if let Ok(file_name) = entry.file_name().into_string() {
                            if file_name.ends_with(".json") {
                                list.push(file_name);
                            }
                        }
                    }
                }
            }

            list.sort();
            list
        }
        Err(_) => vec![],
    }
}

fn generate_watch_config(
    config_share_secret: String,
    base_folder: &str,
) -> serde_json::Map<String, serde_json::Value> {
    let config_files = get_currently_existing_config_file_names(CONFIGS_FOLDER);
    println!(
        "detected config files ({}): {:?}",
        config_files.len(),
        config_files
    );
    let mut config_files_in_config_dir = Vec::new();
    for file in config_files {
        config_files_in_config_dir.push(format!("{}/{}", CONFIGS_FOLDER, file));
    }

    let config_file_refs = config_files_in_config_dir
        .iter()
        .map(String::as_ref)
        .collect::<Vec<_>>();

    let mut own_config = match parse::read_and_merge(&config_file_refs) {
        Ok(merged) => parse::apply_base_folder(merged, base_folder),
        Err(err) => {
            println!(
                "WARNING: failed to parse config. Fall back to safe mode. Error: {}",
                err
            );
            config::own::Config::default()
        }
    };

    own_config
        .folders
        .insert(CONFIGS_FOLDER.to_string(), config_share_secret);

    own_config.into_resilio_config()
}
