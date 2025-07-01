package utils

import (
	"fmt"
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
