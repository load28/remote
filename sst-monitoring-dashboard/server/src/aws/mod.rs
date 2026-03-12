pub mod cloudformation;
pub mod cloudwatch;
pub mod lambda;

use aws_config::SdkConfig;

#[derive(Clone)]
pub struct AwsClients {
    pub cf: aws_sdk_cloudformation::Client,
    pub logs: aws_sdk_cloudwatchlogs::Client,
    pub lambda: aws_sdk_lambda::Client,
}

impl AwsClients {
    pub fn new(config: &SdkConfig) -> Self {
        Self {
            cf: aws_sdk_cloudformation::Client::new(config),
            logs: aws_sdk_cloudwatchlogs::Client::new(config),
            lambda: aws_sdk_lambda::Client::new(config),
        }
    }
}
