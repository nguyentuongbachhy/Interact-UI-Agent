use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::sync::Arc;

use super::jwt::{Claims, JwtHandler};

/// Authenticated user information extracted from JWT
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: String,
    pub username: Option<String>,
}

/// Authentication middleware that validates JWT tokens
///
/// Extracts the JWT token from the Authorization header (Bearer token)
/// and validates it. If valid, adds the user info to request extensions.
pub async fn auth_middleware(
    State(jwt_handler): State<Arc<JwtHandler>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Check if it's a Bearer token
    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Extract token
    let token = &auth_header[7..]; // Remove "Bearer " prefix

    // Validate token
    let claims = jwt_handler
        .validate(token)
        .map_err(|e| {
            tracing::warn!("JWT validation failed: {}", e);
            StatusCode::UNAUTHORIZED
        })?;

    // Add user info to request extensions
    request.extensions_mut().insert(AuthUser {
        user_id: claims.sub,
        username: claims.username,
    });

    Ok(next.run(request).await)
}

/// Optional authentication middleware (doesn't fail if no token)
///
/// Tries to extract and validate JWT token, but doesn't fail the request
/// if the token is missing or invalid. Useful for endpoints that work
/// with or without authentication.
pub async fn optional_auth_middleware(
    State(jwt_handler): State<Arc<JwtHandler>>,
    mut request: Request,
    next: Next,
) -> Response {
    // Try to extract authorization header
    if let Some(auth_header) = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
    {
        if auth_header.starts_with("Bearer ") {
            let token = &auth_header[7..];

            // Try to validate token
            if let Ok(claims) = jwt_handler.validate(token) {
                request.extensions_mut().insert(AuthUser {
                    user_id: claims.sub,
                    username: claims.username,
                });
            }
        }
    }

    next.run(request).await
}
