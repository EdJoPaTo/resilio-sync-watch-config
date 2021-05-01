use serde::{Deserialize, Serialize};

// Currently not complete

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub device_name: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub listening_port: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub storage_path: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub pid_file: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_trash_ttl: Option<u32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub disk_min_free_space_gb: Option<u32>,

    /// limit in kB/s
    #[serde(skip_serializing_if = "Option::is_none")]
    pub download_limit: Option<u32>,

    /// limit in kB/s
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upload_limit: Option<u32>,

    pub shared_folders: Vec<Folder>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Folder {
    pub dir: String,
    pub secret: String,

    /// enable SyncArchive to store files deleted on remote devices. default: on
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_sync_trash: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub search_lan: Option<bool>,
}

impl Config {
    pub fn new(device_name: String) -> Self {
        Self {
            device_name,
            disk_min_free_space_gb: None,
            download_limit: None,
            listening_port: None,
            pid_file: None,
            shared_folders: Vec::new(),
            storage_path: None,
            sync_trash_ttl: None,
            upload_limit: None,
        }
    }
}

impl Folder {
    pub fn new(secret: String, dir: String) -> Self {
        Self {
            dir,
            search_lan: None,
            secret,
            use_sync_trash: None,
        }
    }
}

pub const DEFAULT_META_FOLDER: &str = ".resilio-sync-watch-config";
pub const DEFAULT_STORAGE_PATH: &str = ".resilio-sync-watch-config/.sync";
pub const DEFAULT_PID_FILE: &str = ".resilio-sync-watch-config/resilio.pid";

impl Default for Config {
    fn default() -> Self {
        #[cfg(debug_assertions)]
        let hostname = "testing please ignore".to_string();
        #[cfg(not(debug_assertions))]
        let hostname = hostname::get()
            .ok()
            .and_then(|o| o.into_string().ok())
            .expect("failed to read hostname");

        let mut config = Self::new(hostname);
        config.storage_path = Some(DEFAULT_STORAGE_PATH.to_string());
        config.pid_file = Some(DEFAULT_PID_FILE.to_string());

        config
    }
}
