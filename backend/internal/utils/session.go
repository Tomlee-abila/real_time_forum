package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
	"github.com/google/uuid"
)

// Session represents a user session
type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

// CreateSession creates a new session for a user
func CreateSession(userID string) (*Session, error) {
	sessionID := uuid.New().String()
	token, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	expiresAt := time.Now().Add(24 * time.Hour) // Session expires in 24 hours

	// Insert session into database
	query := `
        INSERT INTO sessions (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
    `

	_, err = database.DB.Exec(query, sessionID, userID, token, expiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &Session{
		ID:        sessionID,
		UserID:    userID,
		Token:     token,
		ExpiresAt: expiresAt,
	}, nil
}

// GetSessionByToken retrieves a session by token
func GetSessionByToken(token string) (*Session, error) {
	query := `
        SELECT id, user_id, token, expires_at
        FROM sessions 
        WHERE token = ? AND expires_at > ?
    `

	var session Session
	err := database.DB.QueryRow(query, token, time.Now()).Scan(
		&session.ID, &session.UserID, &session.Token, &session.ExpiresAt,
	)

	if err != nil {
		return nil, fmt.Errorf("session not found or expired")
	}

	return &session, nil
}

// DeleteSession deletes a session (for logout)
func DeleteSession(token string) error {
	query := "DELETE FROM sessions WHERE token = ?"
	_, err := database.DB.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	return nil
}

// CleanupExpiredSessions removes expired sessions from database
func CleanupExpiredSessions() error {
	query := "DELETE FROM sessions WHERE expires_at <= ?"
	_, err := database.DB.Exec(query, time.Now())
	if err != nil {
		return fmt.Errorf("failed to cleanup sessions: %w", err)
	}
	return nil
}

// SetSessionCookie sets the session cookie in the response
func SetSessionCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		MaxAge:   24 * 60 * 60, // 24 hours
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

// GetSessionFromRequest extracts session token from request cookie
func GetSessionFromRequest(r *http.Request) (string, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return "", fmt.Errorf("no session cookie found")
	}
	return cookie.Value, nil
}

// ClearSessionCookie clears the session cookie (for logout)
func ClearSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

// generateSecureToken generates a cryptographically secure random token
func generateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
