#![forbid(unsafe_code)]

use std::fs;
use std::process::exit;
use std::thread::sleep;
use std::time::{Duration, SystemTime};

use crate::config::resilio::DEFAULT_META_FOLDER;
use signal_hook::iterator::Signals;

mod cli;
mod config;
mod parse;
mod resilio;
mod share;
mod watch;

#[allow(clippy::too_many_lines)]
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

    // TODO: maybe bad performance of pending().next()
    let mut signals = Signals::new(&[nix::libc::SIGINT, nix::libc::SIGTERM])
        .expect("failed to create signal handler");

    match matches.subcommand() {
        ("single", Some(matches)) => {
            println!("Start in single folder mode...");
            let share_secret = get_share_secret_from_arg(matches.value_of("share secret"))
                .expect("Share secret could not be read or is invalid");

            let mut folder =
                config::resilio::Folder::new(share_secret, format!("{}/single", basedir));
            if !matches.is_present("sync trash") {
                folder.use_sync_trash = Some(false);
            }

            let mut config = config::resilio::Config::default();
            config.shared_folders.push(folder);

            let mut resilio = resilio::Resilio::new("rslsync", &config);

            loop {
                if let Some(signal) = signals.pending().next() {
                    println!("Received signal {}", signal);
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

                sleep(Duration::from_millis(250));
            }
        }
        ("watch", Some(matches)) => {
            const CLEANUP_AFTER_SUCCESSFUL_SECONDS: u64 = 60 * 5; // 5 min
            const CONFIGS_FOLDER: &str = ".resilio-sync-watch-config/configs";

            println!("Start in watch share mode...");
            let share_secret = get_share_secret_from_arg(matches.value_of("share secret"))
                .expect("Share secret could not be read or is invalid");

            let mut safe_start = matches.is_present("safe start");
            let cleanup = matches.is_present("cleanup folders");
            let mut exits = false;

            loop {
                if exits {
                    break;
                }

                if safe_start {
                    let _ = fs::remove_dir_all(DEFAULT_META_FOLDER);
                    safe_start = false;
                }

                // TODO: stricten permissions on configs folder (chmod -R go-rwx)
                fs::create_dir_all(CONFIGS_FOLDER).expect("failed to create configs folder");
                let watchcat = crate::watch::Watchcat::new(CONFIGS_FOLDER)
                    .expect("failed to create config folder watcher");

                let (folders, resilio_config) =
                    watch::generate_config(CONFIGS_FOLDER, share_secret.to_owned(), basedir);
                let mut resilio = resilio::Resilio::new_unsafe("rslsync", &resilio_config);

                let start_time = SystemTime::now();
                let mut cleanup_done = false;

                loop {
                    if let Some(signal) = signals.pending().next() {
                        println!("Received signal {}", signal);
                        exits = true;
                        break;
                    }

                    let changed = watchcat.get_changed_filenames();
                    if !changed.is_empty() {
                        println!(
                            "Config change detected. Restart with new config. Changed: {:?}",
                            changed
                        );
                        break;
                    }

                    if !resilio
                        .is_running()
                        .expect("failed to check if resilio is still running")
                    {
                        println!("Resilio stopped unexpectedly! Restart with safe mode...");

                        // Prevent endless crash loop to kill the hardware resources
                        sleep(Duration::from_secs(5));

                        safe_start = true;
                        break;
                    }

                    if cleanup && !cleanup_done {
                        if let Ok(passed) = SystemTime::now().duration_since(start_time) {
                            if passed.as_secs() > CLEANUP_AFTER_SUCCESSFUL_SECONDS {
                                watch::cleanup_base_folder(basedir, &folders)
                                    .expect("failed to cleanup base directory");
                                cleanup_done = true;
                            }
                        }
                    }

                    sleep(Duration::from_millis(250));
                }
            }
        }
        (command, Some(_)) => todo!("Subcommand '{}' not yet implemented", command),
        _ => unimplemented!("You have to use a subcommand to run this tool"),
    }
}

fn get_share_secret_from_arg(secret_or_file_arg: Option<&str>) -> Option<String> {
    let arg = secret_or_file_arg?;

    // TODO: try to stricten permissions on share file (chmod -R go-rwx)

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
