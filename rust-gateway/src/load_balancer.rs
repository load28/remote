use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

/// Round-Robin Load Balancer
#[derive(Debug, Clone)]
pub struct LoadBalancer {
    servers: Arc<Vec<String>>,
    current: Arc<AtomicUsize>,
}

impl LoadBalancer {
    pub fn new(servers: Vec<String>) -> Self {
        LoadBalancer {
            servers: Arc::new(servers),
            current: Arc::new(AtomicUsize::new(0)),
        }
    }

    /// Get the next backend server using round-robin algorithm
    pub fn next_server(&self) -> Option<&str> {
        if self.servers.is_empty() {
            return None;
        }

        let index = self.current.fetch_add(1, Ordering::SeqCst) % self.servers.len();
        Some(&self.servers[index])
    }

    /// Get the number of available servers
    pub fn server_count(&self) -> usize {
        self.servers.len()
    }

    /// Get all backend servers
    pub fn servers(&self) -> &[String] {
        &self.servers
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_round_robin() {
        let servers = vec![
            "http://localhost:3001".to_string(),
            "http://localhost:3002".to_string(),
            "http://localhost:3003".to_string(),
        ];
        let lb = LoadBalancer::new(servers);

        assert_eq!(lb.next_server(), Some("http://localhost:3001"));
        assert_eq!(lb.next_server(), Some("http://localhost:3002"));
        assert_eq!(lb.next_server(), Some("http://localhost:3003"));
        assert_eq!(lb.next_server(), Some("http://localhost:3001")); // wraps around
    }

    #[test]
    fn test_empty_servers() {
        let lb = LoadBalancer::new(vec![]);
        assert_eq!(lb.next_server(), None);
    }

    #[test]
    fn test_server_count() {
        let servers = vec![
            "http://localhost:3001".to_string(),
            "http://localhost:3002".to_string(),
        ];
        let lb = LoadBalancer::new(servers);
        assert_eq!(lb.server_count(), 2);
    }
}
