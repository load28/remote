use scylla::transport::session::Session;
use scylla::SessionBuilder;
use std::sync::Arc;
use uuid::Uuid;

use crate::config::ScyllaConfig;
use crate::gateway::ChatMessage;

pub struct ScyllaStore {
    session: Arc<Session>,
    keyspace: String,
}

impl ScyllaStore {
    pub async fn new(config: &ScyllaConfig) -> anyhow::Result<Self> {
        let session = SessionBuilder::new()
            .known_nodes(&config.nodes)
            .build()
            .await?;

        let store = Self {
            session: Arc::new(session),
            keyspace: config.keyspace.clone(),
        };

        store.init_schema().await?;

        Ok(store)
    }

    async fn init_schema(&self) -> anyhow::Result<()> {
        // Create keyspace
        let create_keyspace = format!(
            r#"
            CREATE KEYSPACE IF NOT EXISTS {}
            WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': 1}}
            "#,
            self.keyspace
        );
        self.session.query(create_keyspace, &[]).await?;

        // Use keyspace
        let use_keyspace = format!("USE {}", self.keyspace);
        self.session.query(use_keyspace, &[]).await?;

        // Create messages table
        self.session
            .query(
                r#"
                CREATE TABLE IF NOT EXISTS messages (
                    room_id uuid,
                    message_id uuid,
                    sender_id uuid,
                    recipient_id uuid,
                    content text,
                    timestamp timestamp,
                    delivered_at timestamp,
                    read_at timestamp,
                    PRIMARY KEY ((room_id), timestamp, message_id)
                ) WITH CLUSTERING ORDER BY (timestamp DESC, message_id DESC)
                "#,
                &[],
            )
            .await?;

        // Create messages by user table for undelivered messages
        self.session
            .query(
                r#"
                CREATE TABLE IF NOT EXISTS messages_by_user (
                    user_id uuid,
                    message_id uuid,
                    room_id uuid,
                    sender_id uuid,
                    content text,
                    timestamp timestamp,
                    delivered boolean,
                    PRIMARY KEY ((user_id), timestamp, message_id)
                ) WITH CLUSTERING ORDER BY (timestamp DESC, message_id DESC)
                "#,
                &[],
            )
            .await?;

        // Create message lookup table
        self.session
            .query(
                r#"
                CREATE TABLE IF NOT EXISTS message_lookup (
                    message_id uuid PRIMARY KEY,
                    room_id uuid,
                    sender_id uuid,
                    recipient_id uuid,
                    content text,
                    timestamp timestamp
                )
                "#,
                &[],
            )
            .await?;

        Ok(())
    }

    pub async fn save_message(&self, message: &ChatMessage) -> anyhow::Result<()> {
        let room_id = message.room_id.unwrap_or(message.sender_id);

        // Insert into messages table
        self.session
            .query(
                r#"
                INSERT INTO messages (room_id, message_id, sender_id, recipient_id, content, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
                "#,
                (
                    room_id,
                    message.id,
                    message.sender_id,
                    message.recipient_id,
                    &message.content,
                    message.timestamp.timestamp_millis(),
                ),
            )
            .await?;

        // Insert into lookup table
        self.session
            .query(
                r#"
                INSERT INTO message_lookup (message_id, room_id, sender_id, recipient_id, content, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
                "#,
                (
                    message.id,
                    room_id,
                    message.sender_id,
                    message.recipient_id,
                    &message.content,
                    message.timestamp.timestamp_millis(),
                ),
            )
            .await?;

        // Insert into user messages if there's a recipient
        if let Some(recipient_id) = message.recipient_id {
            self.session
                .query(
                    r#"
                    INSERT INTO messages_by_user (user_id, message_id, room_id, sender_id, content, timestamp, delivered)
                    VALUES (?, ?, ?, ?, ?, ?, false)
                    "#,
                    (
                        recipient_id,
                        message.id,
                        room_id,
                        message.sender_id,
                        &message.content,
                        message.timestamp.timestamp_millis(),
                    ),
                )
                .await?;
        }

        Ok(())
    }

    pub async fn get_message(&self, message_id: Uuid) -> anyhow::Result<Option<ChatMessage>> {
        let result = self
            .session
            .query(
                "SELECT message_id, room_id, sender_id, recipient_id, content, timestamp FROM message_lookup WHERE message_id = ?",
                (message_id,),
            )
            .await?;

        if let Some(rows) = result.rows {
            if let Some(row) = rows.into_iter().next() {
                let (msg_id, room_id, sender_id, recipient_id, content, timestamp): (
                    Uuid,
                    Uuid,
                    Uuid,
                    Option<Uuid>,
                    String,
                    i64,
                ) = row.into_typed()?;

                return Ok(Some(ChatMessage {
                    id: msg_id,
                    sender_id,
                    recipient_id,
                    room_id: Some(room_id),
                    content,
                    timestamp: chrono::DateTime::from_timestamp_millis(timestamp)
                        .unwrap_or_else(chrono::Utc::now),
                }));
            }
        }

        Ok(None)
    }

    pub async fn get_room_messages(
        &self,
        room_id: Uuid,
        before: Option<chrono::DateTime<chrono::Utc>>,
        limit: usize,
    ) -> anyhow::Result<Vec<ChatMessage>> {
        let query = if let Some(before_time) = before {
            format!(
                "SELECT message_id, sender_id, recipient_id, content, timestamp FROM messages WHERE room_id = ? AND timestamp < ? LIMIT {}",
                limit
            )
        } else {
            format!(
                "SELECT message_id, sender_id, recipient_id, content, timestamp FROM messages WHERE room_id = ? LIMIT {}",
                limit
            )
        };

        let result = if let Some(before_time) = before {
            self.session
                .query(&query, (room_id, before_time.timestamp_millis()))
                .await?
        } else {
            self.session.query(&query, (room_id,)).await?
        };

        let mut messages = Vec::new();
        if let Some(rows) = result.rows {
            for row in rows {
                let (msg_id, sender_id, recipient_id, content, timestamp): (
                    Uuid,
                    Uuid,
                    Option<Uuid>,
                    String,
                    i64,
                ) = row.into_typed()?;

                messages.push(ChatMessage {
                    id: msg_id,
                    sender_id,
                    recipient_id,
                    room_id: Some(room_id),
                    content,
                    timestamp: chrono::DateTime::from_timestamp_millis(timestamp)
                        .unwrap_or_else(chrono::Utc::now),
                });
            }
        }

        Ok(messages)
    }

    pub async fn get_undelivered_messages(&self, user_id: Uuid) -> anyhow::Result<Vec<ChatMessage>> {
        let result = self
            .session
            .query(
                "SELECT message_id, room_id, sender_id, content, timestamp FROM messages_by_user WHERE user_id = ? AND delivered = false",
                (user_id,),
            )
            .await?;

        let mut messages = Vec::new();
        if let Some(rows) = result.rows {
            for row in rows {
                let (msg_id, room_id, sender_id, content, timestamp): (
                    Uuid,
                    Uuid,
                    Uuid,
                    String,
                    i64,
                ) = row.into_typed()?;

                messages.push(ChatMessage {
                    id: msg_id,
                    sender_id,
                    recipient_id: Some(user_id),
                    room_id: Some(room_id),
                    content,
                    timestamp: chrono::DateTime::from_timestamp_millis(timestamp)
                        .unwrap_or_else(chrono::Utc::now),
                });
            }
        }

        Ok(messages)
    }

    pub async fn mark_message_delivered(&self, message_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        // Get message info first
        if let Some(message) = self.get_message(message_id).await? {
            self.session
                .query(
                    "UPDATE messages_by_user SET delivered = true WHERE user_id = ? AND timestamp = ? AND message_id = ?",
                    (user_id, message.timestamp.timestamp_millis(), message_id),
                )
                .await?;

            self.session
                .query(
                    "UPDATE messages SET delivered_at = ? WHERE room_id = ? AND timestamp = ? AND message_id = ?",
                    (
                        chrono::Utc::now().timestamp_millis(),
                        message.room_id.unwrap_or(message.sender_id),
                        message.timestamp.timestamp_millis(),
                        message_id,
                    ),
                )
                .await?;
        }

        Ok(())
    }

    pub async fn mark_message_read(&self, message_id: Uuid, user_id: Uuid) -> anyhow::Result<()> {
        if let Some(message) = self.get_message(message_id).await? {
            self.session
                .query(
                    "UPDATE messages SET read_at = ? WHERE room_id = ? AND timestamp = ? AND message_id = ?",
                    (
                        chrono::Utc::now().timestamp_millis(),
                        message.room_id.unwrap_or(message.sender_id),
                        message.timestamp.timestamp_millis(),
                        message_id,
                    ),
                )
                .await?;
        }

        Ok(())
    }
}
