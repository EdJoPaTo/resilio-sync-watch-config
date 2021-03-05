use clap::{App, AppSettings, Arg, SubCommand};

pub fn build() -> App<'static, 'static> {
    App::new("Resilio Sync Watch Config")
        .version(env!("CARGO_PKG_VERSION"))
        .author(env!("CARGO_PKG_AUTHORS"))
        .about(env!("CARGO_PKG_DESCRIPTION"))
        .setting(AppSettings::SubcommandRequired)
        .global_setting(AppSettings::ColoredHelp)
        .subcommand(
            SubCommand::with_name("single")
                .about("Sync a single share with Resilio")
                .arg(
                    Arg::with_name("sync trash")
                        .long("enable-trash")
                        .global(true)
                        .help("Enable rslsync trash (use_sync_trash: true). Defaults to not using sync trash (different to default rslsync)"),
                )
                        .arg(
                    Arg::with_name("share secret")
                        .value_name("SECRET_OR_FILE")
                        .takes_value(true)
                        .required(true)
                        .default_value("share.txt")
                        .help("Share secret to be synced. Can be the secret itself or a filename which contains the secret"),
                )
        )
        .subcommand(
            SubCommand::with_name("parse")
                .about("Reads (multiple) own JSON config files and prints the resulting Resilio config to stdout")
                .arg(
                    Arg::with_name("config")
                        .value_name("FILE")
                        .multiple(true)
                        .takes_value(true)
                        .required(true)
                        .help("Path(s) to own JSON config files"),
                )
        )
        .subcommand(
            SubCommand::with_name("watch")
                .about("Provide Resilio with a share secret which contains own config files. These are parsed into a Resilio config and Resilio is started with it. The config files in the share are watched and Resilio is restarted on changes.")
                .arg(
                    Arg::with_name("share secret")
                        .value_name("SECRET_OR_FILE")
                        .takes_value(true)
                        .required(true)
                        .default_value("share.txt")
                        .help("Share secret to be synced which contains the own configs. Can be the secret itself or a filename which contains the secret"),
                )
                .arg(
                    Arg::with_name("safe start")
                        .long("safe-start")
                        .short("s")
                        .help("clean all state of Resilio before starting")
                        .long_help("clean all state of Resilio before starting. Ensures old runs of Resilio dont influence the correct syncing. Basically removes the storage_path. This is helpful when switching the share key. Only the first start of Resilio will be done with safe-mode. When Resilio stops/crashes when it shouldnt safe-mode is enabled for the next start regardless of this flag.")
                )
        )
        .arg(
            Arg::with_name("base directory")
                .short("b")
                .long("basedir")
                .value_name("DIRECTORY")
                .global(true)
                .takes_value(true)
                .default_value("folders")
                .help("Folder in which the resulting share(s) should be synced"),
        )
}
