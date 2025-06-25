package utils

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/database"
	"github.com/Tomlee-abila/real_time_forum/backend/internal/models"
	"github.com/google/uuid"
)

// GenerateSessionToken creates a new session for the user
func GenerateSessionToken(userID string) (*models.Session, error) {
	session := &models.Session{
		ID:        uuid.New().String(),
		UserID:    userID,
		Token:     uuid.New().String(),
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hour expiration
	}

	// Insert session into database
	query := `
		INSERT INTO sessions (id, user_id, token, expires_at)
		VALUES (?, ?, ?, ?)
	`

	_, err := database.DB.Exec(query, session.ID, session.UserID, session.Token, session.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("error creating session: %w", err)
	}

	return session, nil
}

// SetSessionCookie sets the session token as an HTTP-only cookie
func SetSessionCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, cookie)
}