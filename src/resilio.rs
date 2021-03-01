use std::io::Write;
use std::ops::Div;
use std::process::{Child, Command, Stdio};
use std::thread::sleep;
use std::time::Duration;

use nix::sys::signal::{self, Signal};
use nix::unistd::Pid;
use tempfile::NamedTempFile;

use crate::config::resilio::Config;

#[derive(Debug)]
pub enum StopKind {
    Normally,
    Killed,
}

#[derive(Debug)]
pub struct Resilio {
    config_file: NamedTempFile,
    process: Child,
}

impl Resilio {
    pub fn new(binary: &str, config: &Config) -> Self {
        Self::new_unsafe(binary, config)
    }

    pub fn new_unsafe<T>(binary: &str, config: &T) -> Self
    where
        T: ?Sized + serde::Serialize,
    {
        println!("Start Resilio...");

        // TODO: create storage_path

        let mut config_file = tempfile::Builder::new()
            .prefix("resilio-sync-watch-config-")
            .suffix(".conf")
            .tempfile()
            .expect("failed to create temporary config file");

        let mut contents = serde_json::to_string_pretty(&config)
            .expect("could not serialize resilio config to json");
        contents = contents.replace(": null", ": undefined");

        config_file
            .write_all(contents.as_bytes())
            .expect("could not write resilio config to the temporary config file");

        let handle = Command::new(binary)
            .arg("--nodaemon")
            .arg("--config")
            .arg(&config_file.path())
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .expect("failed to start rslsync process");
        println!("Resilio started.");

        Self {
            config_file,
            process: handle,
        }
    }

    pub fn is_running(&mut self) -> std::io::Result<bool> {
        let has_exitstatus = self.process.try_wait()?.is_some();
        Ok(!has_exitstatus)
    }

    fn stop(&mut self) -> std::io::Result<StopKind> {
        const MAX_DURATION: Duration = Duration::from_secs(10);
        const STEPS: u32 = 200;
        // TODO: wait for some divide function to be stable in const
        // const SINGLE_DURATION: Duration = MAX_DURATION.checked_div(STEPS).unwrap();

        println!("Stop Resilio...");

        if self.process.try_wait()?.is_none() {
            #[allow(clippy::cast_possible_wrap)]
            if let Err(err) = signal::kill(Pid::from_raw(self.process.id() as i32), Signal::SIGTERM)
            {
                println!(
                    "WARNING: failed to gracefully signal Resilio to stop: {}",
                    err
                );
            }
        }

        let single_duration = MAX_DURATION.div(STEPS);
        for _ in 0..STEPS {
            if self.process.try_wait()?.is_none() {
                sleep(single_duration);
            } else {
                break;
            }
        }

        // If its still not stopped use SIGKILL
        if self.process.try_wait()?.is_none() {
            self.process.kill()?;
            println!("Resilio was killed as it took too long.");
            Ok(StopKind::Killed)
        } else {
            println!("Resilio stopped normally.");
            Ok(StopKind::Normally)
        }
    }
}

impl Drop for Resilio {
    fn drop(&mut self) {
        self.stop().expect("failed to stop Resilio");
    }
}
