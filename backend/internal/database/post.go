package database

import (
	"fmt"
	"time"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/models"
	"github.com/google/uuid"
)

// CreatePost creates a new post in the database
func CreatePost(userID string, post *models.PostCreation) (*models.Post, error) {
	postID := uuid.New().String()
	createdAt := time.Now()

	query := `
        INSERT INTO posts (id, user_id, title, content, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `

	_, err := DB.Exec(query, postID, userID, post.Title, post.Content, post.Category, createdAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	// Get user nickname for response
	user, err := GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	return &models.Post{
		ID:           postID,
		UserID:       userID,
		Title:        post.Title,
		Content:      post.Content,
		Category:     post.Category,
		CreatedAt:    createdAt,
		UserNickname: user.Nickname,
	}, nil
}
