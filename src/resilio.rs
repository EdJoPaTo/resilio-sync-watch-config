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
    NotStarted,
    StoppedNormally,
    Killed,
}

#[derive(Debug)]
pub struct Resilio {
    config_file: NamedTempFile,
    binary: &'static str,
    process: Option<Child>,
}

impl Resilio {
    pub fn new(binary: &'static str) -> Self {
        let config_file = tempfile::Builder::new()
            .prefix("resilio-sync-watch-config-")
            .suffix(".conf")
            .tempfile()
            .expect("failed to create temporary config file");

        Self {
            config_file,
            binary,
            process: None,
        }
    }

    pub fn is_running(&mut self) -> std::io::Result<bool> {
        if let Some(handle) = &mut self.process {
            let has_exitstatus = handle.try_wait()?.is_some();
            Ok(!has_exitstatus)
        } else {
            Ok(false)
        }
    }

    pub fn start(&mut self, config: &Config) {
        self.start_unsafe(config)
    }

    pub fn start_unsafe<T>(&mut self, config: &T)
    where
        T: ?Sized + serde::Serialize,
    {
        let mut contents = serde_json::to_string_pretty(&config)
            .expect("could not serialize resilio config to json");
        contents = contents.replace(": null", ": undefined");

        self.stop().expect(
            "failed to stop the running resilio process before attempting to start the new one",
        );

        self.config_file
            .write_all(contents.as_bytes())
            .expect("could not write resilio config to the temporary config file");

        let handle = Command::new(self.binary)
            .arg("--nodaemon")
            .arg("--config")
            .arg(&self.config_file.path())
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .expect("failed to start rslsync process");
        self.process = Some(handle);
    }

    pub fn stop(&mut self) -> std::io::Result<StopKind> {
        const MAX_DURATION: Duration = Duration::from_secs(10);
        const STEPS: u32 = 200;
        // TODO: wait for some divide function to be stable in const
        // const SINGLE_DURATION: Duration = MAX_DURATION.checked_div(STEPS).unwrap();

        let stop_kind = if let Some(handle) = &mut self.process {
            if handle.try_wait()?.is_none() {
                #[allow(clippy::cast_possible_wrap)]
                if let Err(err) = signal::kill(Pid::from_raw(handle.id() as i32), Signal::SIGTERM) {
                    println!(
                        "WARNING: failed to gracefully signal Resilio to stop: {}",
                        err
                    );
                }
            }

            let single_duration = MAX_DURATION.div(STEPS);
            for _ in 0..STEPS {
                if handle.try_wait()?.is_none() {
                    sleep(single_duration);
                } else {
                    break;
                }
            }

            // If its still not stopped use SIGKILL
            if handle.try_wait()?.is_none() {
                handle.kill()?;
                StopKind::Killed
            } else {
                StopKind::StoppedNormally
            }
        } else {
            StopKind::NotStarted
        };

        self.process = None;
        Ok(stop_kind)
    }
}

impl Drop for Resilio {
    fn drop(&mut self) {
        self.stop().expect("failed to stop the Resilio process");
    }
}
