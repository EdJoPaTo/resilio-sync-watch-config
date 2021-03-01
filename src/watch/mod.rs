use std::fs;

pub use watchcat::Watchcat;

mod watchcat;

pub fn generate_config(
    configs_folder: &str,
    config_share_secret: String,
    base_folder: &str,
) -> serde_json::Map<String, serde_json::Value> {
    let config_files = get_currently_existing_config_file_names(configs_folder);
    println!(
        "detected config files ({}): {:?}",
        config_files.len(),
        config_files
    );
    let mut config_files_in_config_dir = Vec::new();
    for file in config_files {
        config_files_in_config_dir.push(format!("{}/{}", configs_folder, file));
    }

    let config_file_refs = config_files_in_config_dir
        .iter()
        .map(String::as_ref)
        .collect::<Vec<_>>();

    let mut own_config = match crate::parse::read_and_merge(&config_file_refs) {
        Ok(merged) => crate::parse::apply_base_folder(merged, base_folder),
        Err(err) => {
            println!(
                "WARNING: failed to parse config. Fall back to safe mode. Error: {}",
                err
            );
            crate::config::own::Config::default()
        }
    };

    own_config
        .folders
        .insert(configs_folder.to_string(), config_share_secret);

    own_config.into_resilio_config()
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
