use std::fs;
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

        let storage_path = serde_json::from_str::<Config>(&contents)
            .expect("failed to deserialize resilio config string")
            .storage_path
            .unwrap_or_else(|| ".sync".to_string());
        // TODO: stricten permissions on configs folder (chmod -R go-rwx)
        fs::create_dir_all(storage_path).expect("failed to create storage_path folder");

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

    fn stop(&mut self) -> std::io::Result<()> {
        const MAX_DURATION: Duration = Duration::from_secs(30);
        const STEPS: u32 = 200;
        // TODO: wait for some divide function to be stable in const
        // const SINGLE_DURATION: Duration = MAX_DURATION.checked_div(STEPS).unwrap();

        if self.process.try_wait()?.is_none() {
            println!(
                "Stop Resilio... (wait up to {} seconds for Resilio to stop gracefully)",
                MAX_DURATION.as_secs()
            );

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

        if let Some(exit_status) = self.process.try_wait()? {
            match exit_status.code() {
                Some(0) => println!("Resilio stopped normally."),
                Some(exit_code) => println!("Resilio exited with exit code {}", exit_code),
                None => println!("Resilio was terminated by a signal."),
            }
        } else {
            // If its still not stopped use SIGKILL
            self.process.kill()?;
            println!("Resilio was killed as it took too long.");
        }
        Ok(())
    }
}

impl Drop for Resilio {
    fn drop(&mut self) {
        self.stop().expect("failed to stop Resilio");
    }
}
