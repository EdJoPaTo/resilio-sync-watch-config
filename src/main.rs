#![forbid(unsafe_code)]

use std::fs;
use std::process::exit;
use std::thread::sleep;
use std::time::Duration;

use signal_hook::iterator::Signals;

mod cli;
mod config;
mod resilio;
mod share;

fn main() {
    let matches = cli::build().get_matches();

    let basedir = matches
        .value_of("base directory")
        .expect("Base directory could not be read from command line");

    // TODO: handle parse subcommand here before the "running" stuff which has to create folders and so on.

    fs::create_dir_all(basedir).expect("failed to create basedir");
    fs::create_dir_all(".resilio-sync-watch-config/.sync")
        .expect("failed to create working directory");

    let mut resilio = resilio::Resilio::new("rslsync");

    let mut signals = Signals::new(&[nix::libc::SIGINT, nix::libc::SIGTERM])
        .expect("failed to create signal handler");

    match matches.subcommand() {
        ("single", Some(matches)) => {
            println!("Start in single folder mode...");
            let share_secret = get_share_secret_from_arg(matches.value_of("share secret"))
                .expect("Share secret could not be read or is invalid");

            let sync_trash_enabled = matches.is_present("sync trash");

            let mut folder = config::resilio::Folder::new(&share_secret, "folders/single");
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
        (command, Some(_)) => todo!("Subcommand '{}' not yet implemented", command),
        _ => unimplemented!("You have to use a subcommand to run this tool"),
    }

    println!("Stop Resilio...");
    resilio.stop().expect("failed to stop resilio");
    println!("Resilio stopped.");
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
