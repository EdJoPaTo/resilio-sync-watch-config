use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::resilio::Folder;

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Config {
    #[serde(default)]
    pub folders: HashMap<String, String>,

    #[serde(default)]
    pub passthrough: HashMap<String, serde_json::Value>,
    // TODO: folder_passthrough
}

impl Config {
    pub fn add(&self, other: Self) -> Self {
        let mut result = self.clone();

        for (dir, secret) in other.folders {
            result.folders.insert(dir, secret);
        }

        for (key, value) in other.passthrough {
            result.passthrough.insert(key, value);
        }

        result
    }

    pub fn into_resilio_config(self) -> serde_json::Map<String, serde_json::Value> {
        let mut result = super::resilio::Config::default();

        for (dir, secret) in self.folders {
            result.shared_folders.push(Folder::new(secret, dir));
        }

        if let serde_json::Value::Object(mut obj) =
            serde_json::to_value(result).expect("failed to parse config to generic json")
        {
            for (key, value) in self.passthrough {
                obj.insert(key, value);
            }

            match serde_json::from_value::<super::resilio::Config>(serde_json::json!(obj))
                .and_then(serde_json::to_value)
            {
                Ok(serde_json::Value::Object(safe_obj)) => {
                    let missing_keys = obj.keys().cloned().filter(|key| !safe_obj.contains_key(key)).collect::<Vec<_>>();
                    if !missing_keys.is_empty() {
                        eprintln!(
                            "WARNING: final config contains unknown keys: {:?} Either something is misspelled or not known to resilio-sync-watch-config. If you are sure its correctly spelled and working please open an issue on https://github.com/EdJoPaTo/resilio-sync-watch-config/issues.",
                            missing_keys
                        );
                    }
                }
                Ok(value) => panic!(
                    "resilio config was parsed into something not being a JSON object. Resilio wont work with that: {:?}",
                    value
                ),
                Err(err) => eprintln!("WARNING: failed to validate config: {}", err),
            }

            obj
        } else {
            panic!("I just created an object... this has to be an object.");
        }
    }
}
