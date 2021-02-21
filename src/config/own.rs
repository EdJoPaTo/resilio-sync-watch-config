use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub basedir: String,
    pub folders: HashMap<String, String>,
    //TODO: passthrough: Record<string, unknown>
}
