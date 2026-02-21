use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlPlaneState {
    pub schema_version: String,
    pub revision: u64,
    pub updated_at: DateTime<Utc>,
    pub updated_by: String,
    pub servers: Vec<Server>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Server {
    pub id: String,
    pub server_name: String,
    pub listen: Vec<Listen>,
    pub routes: Vec<Route>,
    pub tls: Option<Tls>,
    pub extra_directives: Option<Vec<String>>,
    pub enabled: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub struct Listen {
    pub port: u16,
    pub ssl: bool,
    pub http2: Option<bool>,
    pub default_server: Option<bool>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tls {
    pub certificate: String,
    pub certificate_key: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Route {
    pub id: String,
    pub path: String,
    pub match_type: Option<String>,
    pub action: RouteAction,
    pub headers: Option<Vec<Header>>,
    pub rate_limit: Option<RateLimit>,
    pub enabled: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum RouteAction {
    ProxyPass { target: String },
    Static { root: String, index: Option<String> },
    Redirect { url: String, code: u16 },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Header {
    pub name: String,
    pub value: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RateLimit {
    pub zone: String,
    pub rate: String,
    pub burst: Option<u32>,
    pub nodelay: Option<bool>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SyncState {
    InSync,
    PendingApply,
    Applying,
    OutOfSync,
    Degraded,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub desired_revision: u64,
    pub observed_revision: u64,
    pub sync_state: SyncState,
    pub active_config_hash: Option<String>,
    pub last_error: Option<String>,
    pub updated_at: DateTime<Utc>,
}

impl Default for RuntimeStatus {
    fn default() -> Self {
        Self {
            desired_revision: 0,
            observed_revision: 0,
            sync_state: SyncState::InSync,
            active_config_hash: None,
            last_error: None,
            updated_at: Utc::now(),
        }
    }
}

impl ControlPlaneState {
    pub fn initial() -> Self {
        Self {
            schema_version: "1.0.0".to_owned(),
            revision: 0,
            updated_at: Utc::now(),
            updated_by: "bootstrap".to_owned(),
            servers: Vec::new(),
        }
    }
}
