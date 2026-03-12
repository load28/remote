use crate::aws::AwsClients;
use crate::db::Db;

#[derive(Clone)]
pub struct AppState {
    pub aws: AwsClients,
    pub db: Db,
}
