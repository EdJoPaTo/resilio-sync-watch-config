use std::collections::HashMap;
use std::fs::read_to_string;

use crate::config::own::Config;

pub fn read_and_merge(config_files: &[&str]) -> Result<Config, String> {
    let mut merged = Config::default();
    for file in config_files {
        let text_content = read_to_string(file)
            .map_err(|err| format!("failed to read config file {}: {}", file, err))?;
        merged = merged.add(
            serde_json::from_str(&text_content)
                .map_err(|err| format!("failed to parse config file {}: {}", file, err))?,
        );
    }

    Ok(merged)
}

pub fn apply_base_folder(config: Config, base_folder: &str) -> Config {
    let mut result = Config {
        passthrough: config.passthrough,
        folders: HashMap::new(),
    };

    for (dir, secret) in config.folders {
        result
            .folders
            .insert(format!("{}/{}", base_folder, dir), secret);
    }

    result
}
