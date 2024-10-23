use apollo_router::plugin::Plugin;
use apollo_router::plugin::PluginInit;
use core::ops::Drop;
use schemars::JsonSchema;
use serde::Deserialize;
use tower::BoxError;

pub struct AppDeploymentsPlugin {
    configuration: Config,
}

#[derive(Clone, Debug, Deserialize, JsonSchema)]
pub struct Config {
    /// Default: true
    enabled: Option<bool>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            enabled: Some(true),
        }
    }
}

#[async_trait::async_trait]
impl Plugin for AppDeploymentsPlugin {
    type Config = Config;

    async fn new(init: PluginInit<Config>) -> Result<Self, BoxError> {
        Ok(AppDeploymentsPlugin {
            configuration: init.config,
        })
    }
}

impl Drop for AppDeploymentsPlugin {
    fn drop(&mut self) {
        tracing::debug!("AppDeploymentsPlugin has been dropped!");
        // TODO: cleanup
    }
}
