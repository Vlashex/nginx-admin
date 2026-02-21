use crate::error::Result;
use crate::model::{ControlPlaneState, RouteAction};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};

pub struct RenderResult {
    pub config_hash: String,
    pub staging_conf_path: PathBuf,
}

pub fn render_to_staging(staging_dir: &Path, state: &ControlPlaneState) -> Result<RenderResult> {
    if staging_dir.exists() {
        std::fs::remove_dir_all(staging_dir)?;
    }

    let servers_dir = staging_dir.join("servers");
    std::fs::create_dir_all(&servers_dir)?;

    let mut root = String::new();
    root.push_str("worker_processes auto;\n");
    root.push_str("events { worker_connections 1024; }\n");
    root.push_str("http {\n");
    root.push_str("  include       mime.types;\n");
    root.push_str("  default_type  application/octet-stream;\n");
    root.push_str("  sendfile        on;\n");
    root.push_str("  keepalive_timeout  65;\n");

    let mut server_entries: Vec<_> = state.servers.iter().collect();
    server_entries.sort_by(|a, b| a.id.cmp(&b.id));

    for server in server_entries {
        if !server.enabled {
            continue;
        }
        let server_file = format!("servers/{}.conf", sanitize_filename(&server.id));
        root.push_str(&format!("  include {};\n", server_file));

        let mut server_conf = String::new();
        server_conf.push_str("server {\n");
        server_conf.push_str(&format!("  server_name {};\n", server.server_name));

        for listen in &server.listen {
            let mut parts = vec![listen.port.to_string()];
            if listen.ssl {
                parts.push("ssl".to_owned());
            }
            if listen.http2.unwrap_or(false) {
                parts.push("http2".to_owned());
            }
            if listen.default_server.unwrap_or(false) {
                parts.push("default_server".to_owned());
            }
            server_conf.push_str(&format!("  listen {};\n", parts.join(" ")));
        }

        if let Some(tls) = &server.tls {
            server_conf.push_str(&format!("  ssl_certificate {};\n", tls.certificate));
            server_conf.push_str(&format!("  ssl_certificate_key {};\n", tls.certificate_key));
        }

        let mut routes: Vec<_> = server.routes.iter().collect();
        routes.sort_by(|a, b| a.path.cmp(&b.path));

        for route in routes {
            if !route.enabled {
                continue;
            }
            server_conf.push_str(&format!("  location {} {{\n", route.path));
            match &route.action {
                RouteAction::ProxyPass { target } => {
                    server_conf.push_str(&format!("    proxy_pass {};\n", target));
                }
                RouteAction::Static { root, index } => {
                    server_conf.push_str(&format!("    root {};\n", root));
                    if let Some(index) = index {
                        server_conf.push_str(&format!("    index {};\n", index));
                    }
                }
                RouteAction::Redirect { url, code } => {
                    server_conf.push_str(&format!("    return {} {};\n", code, url));
                }
            }
            server_conf.push_str("  }\n");
        }

        if let Some(extra) = &server.extra_directives {
            for directive in extra {
                server_conf.push_str("  ");
                server_conf.push_str(directive);
                server_conf.push('\n');
            }
        }

        server_conf.push_str("}\n");
        std::fs::write(staging_dir.join(&server_file), server_conf)?;
    }

    root.push_str("}\n");
    let staging_conf_path = staging_dir.join("nginx.conf");
    std::fs::write(&staging_conf_path, root)?;

    let config_hash = hash_directory(staging_dir)?;

    Ok(RenderResult {
        config_hash,
        staging_conf_path,
    })
}

fn hash_directory(path: &Path) -> Result<String> {
    let mut files = Vec::new();
    collect_files(path, &mut files)?;
    files.sort();

    let mut hasher = Sha256::new();
    for file in files {
        hasher.update(file.to_string_lossy().as_bytes());
        hasher.update(std::fs::read(&file)?);
    }
    Ok(hex::encode(hasher.finalize()))
}

fn collect_files(path: &Path, out: &mut Vec<PathBuf>) -> Result<()> {
    for entry in std::fs::read_dir(path)? {
        let entry = entry?;
        let entry_path = entry.path();
        if entry.file_type()?.is_dir() {
            collect_files(&entry_path, out)?;
        } else {
            out.push(entry_path);
        }
    }
    Ok(())
}

fn sanitize_filename(id: &str) -> String {
    id.chars()
        .map(|ch| if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' { ch } else { '_' })
        .collect()
}
