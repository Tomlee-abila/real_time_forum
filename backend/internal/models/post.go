package models

import (
	"errors"
	"strings"
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

// PostWithComments represents a post with its comments
type PostWithComments struct {
	Post     Post      `json:"post"`
	Comments []Comment `json:"comments"`
}

// Validate validates the post creation data
func (pc *PostCreation) Validate() error {
	// Validate title
	if strings.TrimSpace(pc.Title) == "" {
		return errors.New("title is required")
	}
	if len(pc.Title) < 3 || len(pc.Title) > 100 {
		return errors.New("title must be between 3 and 100 characters")
	}

	// Validate content
	if strings.TrimSpace(pc.Content) == "" {
		return errors.New("content is required")
	}
	if len(pc.Content) < 10 || len(pc.Content) > 5000 {
		return errors.New("content must be between 10 and 5000 characters")
	}

	// Validate category
	if strings.TrimSpace(pc.Category) == "" {
		return errors.New("category is required")
	}

	validCategories := []string{
		"general", "technology", "gaming", "sports", "music",
		"movies", "books", "food", "travel", "science", "other",
	}

	if !contains(validCategories, strings.ToLower(pc.Category)) {
		return errors.New("invalid category")
	}

	return nil
}

// Validate validates the comment creation data
func (cc *CommentCreation) Validate() error {
	// Validate content
	if strings.TrimSpace(cc.Content) == "" {
		return errors.New("comment content is required")
	}
	if len(cc.Content) < 1 || len(cc.Content) > 1000 {
		return errors.New("comment must be between 1 and 1000 characters")
	}

	return nil
}

// GetValidCategories returns the list of valid post categories
func GetValidCategories() []string {
	return []string{
		"general", "technology", "gaming", "sports", "music",
		"movies", "books", "food", "travel", "science", "other",
	}
}
