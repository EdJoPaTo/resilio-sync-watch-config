use clap::{app_from_crate, App, AppSettings, Arg};

#[must_use]
pub fn build() -> App<'static> {
    app_from_crate!()
        .name("Resilio Sync Watch Config")
        .setting(AppSettings::SubcommandRequired)
        .subcommand(
            App::new("single")
                .about("Sync a single share with Resilio")
                .arg(
                    Arg::new("sync trash")
                        .long("enable-trash")
                        .help("Enable rslsync trash (use_sync_trash: true). Defaults to not using sync trash (different to default rslsync)"),
                )
                .arg(
                    Arg::new("share secret")
                        .value_name("SECRET_OR_FILE")
                        .takes_value(true)
                        .default_value("share.txt")
                        .help("Share secret to be synced. Can be the secret itself or a filename which contains the secret"),
                )
        )
        .subcommand(
            App::new("parse")
                .about("Reads (multiple) own JSON config files and prints the resulting Resilio config to stdout")
                .arg(
                    Arg::new("config")
                        .value_name("FILE")
                        .multiple_occurrences(true)
                        .takes_value(true)
                        .required(true)
                        .help("Path(s) to own JSON config files"),
                )
        )
        .subcommand(
            App::new("watch")
                .about("Provide Resilio with a share secret which contains own config files. These are parsed into a Resilio config and Resilio is started with it. The config files in the share are watched and Resilio is restarted on changes.")
                .arg(
                    Arg::new("share secret")
                        .value_name("SECRET_OR_FILE")
                        .takes_value(true)
                        .default_value("share.txt")
                        .help("Share secret to be synced which contains the own configs. Can be the secret itself or a filename which contains the secret"),
                )
                .arg(
                    Arg::new("safe start")
                        .long("safe-start")
                        .short('s')
                        .help("clean all state of Resilio before starting")
                        .long_help("clean all state of Resilio before starting. Ensures old runs of Resilio dont influence the correct syncing. Basically removes the storage_path. This is helpful when switching the share key. Only the first start of Resilio will be done with safe-mode. When Resilio stops/crashes when it shouldnt safe-mode is enabled for the next start regardless of this flag.")
                )
                .arg(
                    Arg::new("cleanup folders")
                        .long("cleanup")
                        .help("remove superfluous folders")
                        .long_help("remove superfluous folders. Folders which are not included in the current config are deleted after the current config is running successfully for 5 minutes.")
                )
        )
        .arg(
            Arg::new("base directory")
                .short('b')
                .long("basedir")
                .value_name("DIRECTORY")
                .global(true)
                .takes_value(true)
                .default_value("folders")
                .help("Folder in which the resulting share(s) should be synced"),
        )
        .arg(
            Arg::new("device name")
                .long("device-name")
                .short('n')
                .value_name("NAME")
                .global(true)
                .takes_value(true)
                .help("Override the device name. Defaults to the hostname."),
        )
        .arg(
            Arg::new("listening port")
                .long("listening-port")
                .short('p')
                .value_name("INT")
                .global(true)
                .takes_value(true)
                .help("Set a specific listening port")
                .long_help("Set a specific listening port. Helpful in combination with NAT like in a container environment."),
        )
}

#[test]
fn verify_app() {
    build().debug_assert();
}
