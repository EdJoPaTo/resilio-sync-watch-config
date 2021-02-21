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
                .about("Provide Resilio with a share secret which contains own config files. Resilio is then started with the combined config of these own config files in the share. Updates the config and restarts Resilio on config changes in the shared folder.")
                .arg(
                    Arg::with_name("share secret")
                        .value_name("SECRET_OR_FILE")
                        .takes_value(true)
                        .required(true)
                        .default_value("share.txt")
                        .help("Share secret to be synced which contains the own configs. Can be the secret itself or a filename which contains the secret"),
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
        .arg(
            Arg::with_name("sync trash")
                .long("enable-trash")
                .global(true)
                .help("Enable rslsync trash (use_sync_trash: true). Defaults to not using sync trash (different to default rslsync)"),
        )
}
