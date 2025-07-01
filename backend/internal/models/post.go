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

// Comment represents a comment on a post
type Comment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	// User information for display
	UserNickname string `json:"user_nickname,omitempty"`
}

// PostCreation represents the data needed to create a post
type PostCreation struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	Category string `json:"category"`
}

// CommentCreation represents the data needed to create a comment
type CommentCreation struct {
	Content string `json:"content"`
}
