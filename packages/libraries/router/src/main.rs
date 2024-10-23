// Specify the modules our binary should include -- https://twitter.com/YassinEldeeb7/status/1468680104243077128
mod agent;
mod app_deployments;
mod graphql;
mod registry;
mod registry_logger;
mod usage;

use apollo_router::register_plugin;
use app_deployments::AppDeploymentsPlugin;
use registry::HiveRegistry;
use usage::UsagePlugin;

// Register the hive.usage plugin
pub fn register_plugins() {
    register_plugin!("hive", "usage", UsagePlugin);
    register_plugin!("hive", "app_deployments", AppDeploymentsPlugin);
}

fn main() {
    // Register the Hive plugins
    register_plugins();

    // Initialize the Hive Registry and start the Apollo Router
    match HiveRegistry::new(None).and(apollo_router::main()) {
        Ok(_) => {}
        Err(e) => {
            eprintln!("{}", e);
            std::process::exit(1);
        }
    }
}
