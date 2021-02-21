use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::resilio::Folder;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    #[serde(default)]
    pub folders: HashMap<String, String>,

    #[serde(default)]
    pub passthrough: HashMap<String, serde_json::Value>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            folders: HashMap::new(),
            passthrough: HashMap::new(),
        }
    }
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

            obj
        } else {
            panic!("I just created an object... this has to be an object.");
        }
    }
}
