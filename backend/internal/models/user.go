package models

import (
	"time"
)

// User represents a user in the forum
type User struct {
	ID        string    `json:"id"`
	Nickname  string    `json:"nickname"`
	Age       int       `json:"age"`
	Gender    string    `json:"gender"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // Never include password in JSON responses
	CreatedAt time.Time `json:"created_at"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	EmailOrNickname string `json:"email_or_nickname"`
	Password        string `json:"password"`
}

// Session represents a user session
type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}