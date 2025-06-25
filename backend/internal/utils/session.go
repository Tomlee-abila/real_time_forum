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

// GetSessionFromCookie retrieves session from cookie
func GetSessionFromCookie(r *http.Request) (*models.Session, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return nil, fmt.Errorf("session cookie not found")
	}

	return GetSessionByToken(cookie.Value)
}

// GetSessionByToken retrieves session by token from database
func GetSessionByToken(token string) (*models.Session, error) {
	query := `
		SELECT id, user_id, token, expires_at
		FROM sessions
		WHERE token = ? AND expires_at > ?
	`

	var session models.Session
	err := database.DB.QueryRow(query, token, time.Now()).Scan(
		&session.ID,
		&session.UserID,
		&session.Token,
		&session.ExpiresAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("session not found or expired")
		}
		return nil, fmt.Errorf("error querying session: %w", err)
	}

	return &session, nil
}

// DeleteSession removes a session from the database
func DeleteSession(token string) error {
	query := `DELETE FROM sessions WHERE token = ?`
	_, err := database.DB.Exec(query, token)
	if err != nil {
		return fmt.Errorf("error deleting session: %w", err)
	}
	return nil
}

// ClearSessionCookie clears the session cookie
func ClearSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, cookie)
}