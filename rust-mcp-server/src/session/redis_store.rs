use anyhow::Result;
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use serde_json;

use crate::models::Session;

/// Redis-backed session store for production multi-user scenarios
/// Will be used when USE_REDIS=true in production
#[allow(dead_code)]
pub struct RedisSessionStore {
    client: ConnectionManager,
    expiration_seconds: u64,
}

#[allow(dead_code)] // All methods will be used when USE_REDIS=true in production
impl RedisSessionStore {
    /// Create new Redis session store
    pub async fn new(redis_url: &str, expiration_seconds: u64) -> Result<Self> {
        let client = redis::Client::open(redis_url)?;
        let connection_manager = ConnectionManager::new(client).await?;

        Ok(Self {
            client: connection_manager,
            expiration_seconds,
        })
    }

    /// Save session to Redis with expiration
    pub async fn save(&mut self, session: &Session) -> Result<()> {
        let key = Self::session_key(&session.id);
        let value = serde_json::to_string(session)?;

        self.client
            .set_ex::<_, _, ()>(&key, value, self.expiration_seconds)
            .await?;

        // Also index by user_id if present
        if let Some(user_id) = &session.user_id {
            let user_sessions_key = Self::user_sessions_key(user_id);
            self.client
                .sadd::<_, _, ()>(&user_sessions_key, &session.id)
                .await?;
            self.client
                .expire::<_, ()>(&user_sessions_key, self.expiration_seconds as i64)
                .await?;
        }

        tracing::debug!("Session {} saved to Redis", session.id);
        Ok(())
    }

    /// Get session from Redis
    pub async fn get(&mut self, session_id: &str) -> Result<Option<Session>> {
        let key = Self::session_key(session_id);
        let value: Option<String> = self.client.get(&key).await?;

        match value {
            Some(json) => {
                let session: Session = serde_json::from_str(&json)?;
                tracing::debug!("Session {} retrieved from Redis", session_id);
                Ok(Some(session))
            }
            None => {
                tracing::debug!("Session {} not found in Redis", session_id);
                Ok(None)
            }
        }
    }

    /// Delete session from Redis
    pub async fn delete(&mut self, session_id: &str) -> Result<()> {
        // Get session first to remove from user index
        if let Some(session) = self.get(session_id).await? {
            if let Some(user_id) = &session.user_id {
                let user_sessions_key = Self::user_sessions_key(user_id);
                self.client
                    .srem::<_, _, ()>(&user_sessions_key, session_id)
                    .await?;
            }
        }

        let key = Self::session_key(session_id);
        self.client.del::<_, ()>(&key).await?;

        tracing::debug!("Session {} deleted from Redis", session_id);
        Ok(())
    }

    /// Update session activity (refresh expiration)
    pub async fn update_activity(&mut self, session_id: &str) -> Result<()> {
        let key = Self::session_key(session_id);
        self.client
            .expire::<_, ()>(&key, self.expiration_seconds as i64)
            .await?;

        tracing::debug!("Session {} activity updated", session_id);
        Ok(())
    }

    /// List all sessions for a user
    pub async fn list_user_sessions(&mut self, user_id: &str) -> Result<Vec<String>> {
        let key = Self::user_sessions_key(user_id);
        let sessions: Vec<String> = self.client.smembers(&key).await?;
        Ok(sessions)
    }

    /// List all session IDs (for admin)
    pub async fn list_all_sessions(&mut self) -> Result<Vec<String>> {
        let pattern = "session:*";
        let keys: Vec<String> = self.client.keys(pattern).await?;

        // Extract session IDs from keys
        let session_ids: Vec<String> = keys
            .into_iter()
            .filter_map(|k| k.strip_prefix("session:").map(|s| s.to_string()))
            .collect();

        Ok(session_ids)
    }

    /// Count active sessions
    pub async fn count(&mut self) -> Result<usize> {
        let pattern = "session:*";
        let keys: Vec<String> = self.client.keys(pattern).await?;
        Ok(keys.len())
    }

    /// Clean up expired sessions (Redis handles this automatically, but useful for stats)
    pub async fn cleanup_expired(&mut self) -> Result<usize> {
        // Redis automatically removes expired keys, but we can clean up user indices
        let user_keys: Vec<String> = self.client.keys("user_sessions:*").await?;
        let mut cleaned = 0;

        for user_key in user_keys {
            let session_ids: Vec<String> = self.client.smembers(&user_key).await?;

            for session_id in session_ids {
                // Check if session still exists
                if self.get(&session_id).await?.is_none() {
                    // Remove from user index
                    self.client.srem::<_, _, ()>(&user_key, &session_id).await?;
                    cleaned += 1;
                }
            }
        }

        tracing::info!("Cleaned up {} expired session references", cleaned);
        Ok(cleaned)
    }

    // Helper methods
    fn session_key(session_id: &str) -> String {
        format!("session:{}", session_id)
    }

    fn user_sessions_key(user_id: &str) -> String {
        format!("user_sessions:{}", user_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::BrowserInfo;
    use chrono::Utc;

    #[tokio::test]
    #[ignore] // Requires Redis to be running
    async fn test_redis_store() {
        let mut store = RedisSessionStore::new("redis://localhost:6379", 3600)
            .await
            .unwrap();

        let session = Session {
            id: "test123".to_string(),
            user_id: Some("user456".to_string()),
            created_at: Utc::now(),
            last_activity: Utc::now(),
            browser_info: BrowserInfo {
                initial_url: "http://localhost".to_string(),
                viewport_width: 1280,
                viewport_height: 720,
            },
        };

        // Save
        store.save(&session).await.unwrap();

        // Get
        let retrieved = store.get("test123").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "test123");

        // List user sessions
        let user_sessions = store.list_user_sessions("user456").await.unwrap();
        assert!(user_sessions.contains(&"test123".to_string()));

        // Delete
        store.delete("test123").await.unwrap();
        let deleted = store.get("test123").await.unwrap();
        assert!(deleted.is_none());
    }
}
