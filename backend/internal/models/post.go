package models

import (
	"time"
)

// Post represents a forum post
type Post struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Category  string    `json:"category"`
	CreatedAt time.Time `json:"created_at"`
	// User information for display
	UserNickname string `json:"user_nickname,omitempty"`
	// Comment count for feed display
	CommentCount int `json:"comment_count,omitempty"`
}
