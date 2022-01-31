use std::fs;

pub use watchcat::Watchcat;

mod watchcat;

pub fn generate_config(
    configs_folder: &str,
    config_share_secret: String,
    base_folder: &str,
) -> (Vec<String>, serde_json::Map<String, serde_json::Value>) {
    let config_files = get_currently_existing_config_file_names(configs_folder);
    println!(
        "detected config files ({}): {:?}",
        config_files.len(),
        config_files
    );
    let config_files_in_config_dir = config_files
        .iter()
        .map(|file| format!("{}/{}", configs_folder, file));

    let (folders, mut own_config) = match crate::parse::read_and_merge(config_files_in_config_dir) {
        Ok(merged) => {
            let mut folders = Vec::new();
            for folder in merged.folders.keys() {
                folders.push(folder.clone());
            }

            let config = crate::parse::apply_base_folder(merged, base_folder);
            (folders, config)
        }
        Err(err) => {
            println!(
                "WARNING: failed to parse config. Fall back to minimal config. Error: {}",
                err
            );
            (Vec::new(), crate::config::own::Config::default())
        }
    };

    own_config
        .folders
        .insert(configs_folder.to_string(), config_share_secret);

    (folders, own_config.into_resilio_config())
}

fn get_currently_existing_config_file_names(folder: &str) -> Vec<String> {
    match fs::read_dir(folder) {
        Ok(dir_contents) => {
            let mut list = Vec::new();
            #[allow(clippy::manual_flatten)]
            for entry in dir_contents {
                if let Ok(entry) = entry {
                    let is_file = entry.file_type().map_or(false, |o| o.is_file());
                    if is_file {
                        if let Ok(file_name) = entry.file_name().into_string() {
                            #[allow(clippy::case_sensitive_file_extension_comparisons)]
                            if file_name.to_lowercase().ends_with(".json") {
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

pub fn cleanup_base_folder(
    base_folder: &str,
    expected_folders: &[String],
) -> Result<(), std::io::Error> {
    println!("cleanup folders...");

    #[allow(clippy::manual_flatten)]
    for entry in fs::read_dir(base_folder)? {
        if let Ok(entry) = entry {
            let file_type = entry.file_type()?;

            if file_type.is_dir() {
                if let Ok(name) = entry.file_name().into_string() {
                    if !expected_folders.contains(&name) {
                        println!("cleanup removes folder {}", name);
                        fs::remove_dir_all(entry.path())?;
                    }
                } else {
                    println!(
                        "WARNING: cleanup found {:?} in base directory",
                        entry.file_name()
                    );
                }
            } else {
                println!(
                    "WARNING: cleanup found {:?} in base directory",
                    entry.file_name()
                );
            }
        }
    }
    println!("cleanup done");
    Ok(())
}
