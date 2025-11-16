use anyhow::Result;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// JWT Claims for user authentication
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// User ID
    pub sub: String,

    /// Username (optional)
    pub username: Option<String>,

    /// Issued at (unix timestamp)
    pub iat: u64,

    /// Expiration time (unix timestamp)
    pub exp: u64,
}

impl Claims {
    /// Create new claims for a user
    pub fn new(user_id: String, username: Option<String>, expiration_seconds: u64) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        Self {
            sub: user_id,
            username,
            iat: now,
            exp: now + expiration_seconds,
        }
    }

    /// Check if token is expired
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        self.exp < now
    }
}

/// JWT handler for encoding and decoding tokens
pub struct JwtHandler {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtHandler {
    /// Create new JWT handler from secret
    pub fn new(secret: &str) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
        }
    }

    /// Encode claims into JWT token
    pub fn encode(&self, claims: &Claims) -> Result<String> {
        let token = encode(&Header::default(), claims, &self.encoding_key)?;
        Ok(token)
    }

    /// Decode and validate JWT token
    pub fn decode(&self, token: &str) -> Result<Claims> {
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &Validation::default(),
        )?;

        Ok(token_data.claims)
    }

    /// Validate token and return claims if valid
    pub fn validate(&self, token: &str) -> Result<Claims> {
        let claims = self.decode(token)?;

        if claims.is_expired() {
            return Err(anyhow::anyhow!("Token has expired"));
        }

        Ok(claims)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_encode_decode() {
        let handler = JwtHandler::new("test_secret");
        let claims = Claims::new("user123".to_string(), Some("testuser".to_string()), 3600);

        let token = handler.encode(&claims).unwrap();
        let decoded = handler.decode(&token).unwrap();

        assert_eq!(decoded.sub, "user123");
        assert_eq!(decoded.username, Some("testuser".to_string()));
        assert!(!decoded.is_expired());
    }
}
