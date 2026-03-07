use std::path::PathBuf;
use std::time::Duration;

#[derive(Clone, Debug)]
pub struct DaemonConfig {
    pub unix_socket_path: PathBuf,
    pub socket_group: String,
    pub nginx_api_conf_path: PathBuf,
    pub nginx_server_conf_path: PathBuf,
    pub state_path: PathBuf,
    pub backups_dir: PathBuf,
    pub staging_dir: PathBuf,
    pub runtime_output_dir: PathBuf,
    pub nginx_test_cmd: String,
    pub reload_cmd: String,
    pub reconcile_interval: Duration,
    pub dry_run: bool,
}

impl DaemonConfig {
    pub fn from_env() -> Self {
        let unix_socket_path = PathBuf::from(env("DAEMON_UNIX_SOCKET_PATH", "/run/nginx-admin.sock"));
        let socket_group = env("DAEMON_SOCKET_GROUP", "www-data");
        let nginx_api_conf_path =
            PathBuf::from(env("DAEMON_NGINX_API_CONF_PATH", "/etc/nginx/snippets/nginx-admin-location.conf"));
        let nginx_server_conf_path = PathBuf::from(env(
            "DAEMON_NGINX_SERVER_CONF_PATH",
            "/etc/nginx/sites-enabled/default",
        ));
        let state_path = PathBuf::from(env("DAEMON_STATE_PATH", "/etc/nginx-admin/state.json"));
        let backups_dir = PathBuf::from(env("DAEMON_BACKUPS_DIR", "/var/lib/nginx-admin/backups"));
        let staging_dir = PathBuf::from(env("DAEMON_STAGING_DIR", "/etc/nginx-admin/staging"));
        let runtime_output_dir =
            PathBuf::from(env("DAEMON_RUNTIME_OUTPUT_DIR", "/etc/nginx-admin/generated/runtime"));
        let nginx_test_cmd = env("DAEMON_NGINX_TEST_CMD", "nginx -t -c {staging_conf}");
        let reload_cmd = env("DAEMON_RELOAD_CMD", "nginx -s reload");
        let reconcile_interval = Duration::from_secs(env_u64("DAEMON_RECONCILE_INTERVAL_SECS", 2));
        let dry_run = env_bool("DAEMON_DRY_RUN", false);

        Self {
            unix_socket_path,
            socket_group,
            nginx_api_conf_path,
            nginx_server_conf_path,
            state_path,
            backups_dir,
            staging_dir,
            runtime_output_dir,
            nginx_test_cmd,
            reload_cmd,
            reconcile_interval,
            dry_run,
        }
    }
}

fn env(key: &str, default_value: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default_value.to_owned())
}

fn env_u64(key: &str, default_value: u64) -> u64 {
    std::env::var(key)
        .ok()
        .and_then(|raw| raw.parse::<u64>().ok())
        .unwrap_or(default_value)
}

fn env_bool(key: &str, default_value: bool) -> bool {
    std::env::var(key)
        .ok()
        .map(|raw| {
            let normalized = raw.to_ascii_lowercase();
            normalized == "1" || normalized == "true" || normalized == "yes"
        })
        .unwrap_or(default_value)
}
