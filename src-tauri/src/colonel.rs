use std::process::{Child, Command, Stdio};
use std::path::PathBuf;
use tokio::time::{sleep, Duration};

#[derive(Debug)]
pub struct ColonelManager {
    process: Option<Child>,
    port: u16,
    profile_path: Option<PathBuf>,
}

impl Default for ColonelManager {
    fn default() -> Self {
        Self {
            process: None,
            port: 8264,
            profile_path: None,
        }
    }
}

impl ColonelManager {
    pub fn new(port: u16) -> Self {
        Self {
            process: None,
            port,
            profile_path: None,
        }
    }

    pub fn with_profile<P: Into<PathBuf>>(mut self, profile_path: P) -> Self {
        self.profile_path = Some(profile_path.into());
        self
    }

    pub async fn start(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // If already running, don't start again
        if self.is_running() {
            return Ok(());
        }

        // Try to find The_Colonel installation
        let colonel_path = self.find_colonel_executable()?;
        
        // Build command and arguments based on the executable type
        let (command, mut args) = if colonel_path.file_name() == Some("python3".as_ref()) {
            // Using python3 -m interpreter
            ("python3".to_string(), vec!["-m".to_string(), "interpreter".to_string()])
        } else {
            // Using direct interpreter executable
            (colonel_path.to_string_lossy().to_string(), vec![])
        };

        // Add The_Colonel server arguments
        args.extend(vec![
            "--openwebui_server".to_string(),
            "--host".to_string(),
            "localhost".to_string(),
            "--port".to_string(),
            self.port.to_string(),
        ]);

        // Add profile if specified
        if let Some(profile) = &self.profile_path {
            args.push("--profile".to_string());
            args.push(profile.to_string_lossy().to_string());
        }

        println!("Starting The_Colonel with command: {} {:?}", command, args);

        // Start The_Colonel process
        let child = Command::new(&command)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn The_Colonel process: {}", e))?;

        self.process = Some(child);

        // Wait for the server to be ready
        self.wait_for_ready().await?;

        println!("The_Colonel started successfully on port {}", self.port);
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(mut child) = self.process.take() {
            child.kill()?;
            child.wait()?;
            println!("The_Colonel process stopped");
        }
        Ok(())
    }

    pub fn is_running(&mut self) -> bool {
        if let Some(child) = &mut self.process {
            // Check if process is still running
            match child.try_wait() {
                Ok(Some(_)) => {
                    // Process has exited, clean up
                    self.process = None;
                    false
                }
                Ok(None) => true,     // Process is still running
                Err(_) => false,      // Error checking, assume not running
            }
        } else {
            false
        }
    }

    async fn wait_for_ready(&self) -> Result<(), Box<dyn std::error::Error>> {
        let max_attempts = 30; // 30 seconds timeout
        let url = format!("http://localhost:{}/v1/models", self.port);

        for attempt in 1..=max_attempts {
            match reqwest::get(&url).await {
                Ok(response) if response.status().is_success() => {
                    println!("The_Colonel is ready after {} seconds", attempt);
                    return Ok(());
                }
                _ => {
                    if attempt < max_attempts {
                        sleep(Duration::from_secs(1)).await;
                    }
                }
            }
        }

        Err("The_Colonel failed to start within timeout period".into())
    }

    fn find_colonel_executable(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        // Try different possible locations for The_Colonel
        let possible_paths = vec![
            // Try bundled version first (in Tauri resources)
            PathBuf::from("resources/the_colonel/venv/bin/interpreter"),
            
            // Try relative to current directory (development)
            PathBuf::from("../The_Colonel/venv/bin/interpreter"),
            PathBuf::from("../../The_Colonel/venv/bin/interpreter"),
            
            // Try system-wide installations
            PathBuf::from("/usr/local/bin/interpreter"),
            PathBuf::from("/opt/homebrew/bin/interpreter"),
            
            // Try user installations
            dirs::home_dir().map(|h| h.join(".local/bin/interpreter")).unwrap_or_default(),
            
            // Try current working directory
            PathBuf::from("interpreter"),
        ];

        for path in possible_paths {
            if path.exists() && path.is_file() {
                println!("Found The_Colonel at: {}", path.display());
                return Ok(path);
            }
        }

        // Try using 'which' command to find interpreter
        if let Ok(output) = Command::new("which").arg("interpreter").output() {
            if output.status.success() {
                let path_string = String::from_utf8_lossy(&output.stdout);
                let path_str = path_string.trim();
                let path = PathBuf::from(path_str);
                if path.exists() {
                    println!("Found The_Colonel via 'which': {}", path.display());
                    return Ok(path);
                }
            }
        }

        // Try python -m interpreter
        if let Ok(_) = Command::new("python3")
            .args(&["-c", "import interpreter"])
            .output() 
        {
            println!("Found The_Colonel via python3 -m interpreter");
            return Ok(PathBuf::from("python3"));
        }

        Err("Could not find The_Colonel executable. Please ensure it's installed and accessible.".into())
    }
}

impl Drop for ColonelManager {
    fn drop(&mut self) {
        if let Some(mut child) = self.process.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}