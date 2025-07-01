package database

import (
	"database/sql"
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

// GetAllPosts retrieves all posts with user info and comment count (for feed)
func GetAllPosts(limit, offset int) ([]models.Post, error) {
	query := `
        SELECT 
            p.id, p.user_id, p.title, p.content, p.category, p.created_at,
            u.nickname,
            COUNT(c.id) as comment_count
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN comments c ON p.id = c.post_id
        GROUP BY p.id, p.user_id, p.title, p.content, p.category, p.created_at, u.nickname
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := DB.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		err := rows.Scan(
			&post.ID, &post.UserID, &post.Title, &post.Content, &post.Category, &post.CreatedAt,
			&post.UserNickname, &post.CommentCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// GetPostByID retrieves a specific post by ID
func GetPostByID(postID string) (*models.Post, error) {
	query := `
        SELECT 
            p.id, p.user_id, p.title, p.content, p.category, p.created_at,
            u.nickname
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    `

	var post models.Post
	err := DB.QueryRow(query, postID).Scan(
		&post.ID, &post.UserID, &post.Title, &post.Content, &post.Category, &post.CreatedAt,
		&post.UserNickname,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("post not found")
		}
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	return &post, nil
}

// GetPostWithComments retrieves a post with all its comments
func GetPostWithComments(postID string) (*models.PostWithComments, error) {
	// Get the post
	post, err := GetPostByID(postID)
	if err != nil {
		return nil, err
	}

	// Get comments for the post
	comments, err := GetCommentsByPostID(postID)
	if err != nil {
		return nil, err
	}

	return &models.PostWithComments{
		Post:     *post,
		Comments: comments,
	}, nil
}

// GetPostsByCategory retrieves posts by category
func GetPostsByCategory(category string, limit, offset int) ([]models.Post, error) {
	query := `
        SELECT 
            p.id, p.user_id, p.title, p.content, p.category, p.created_at,
            u.nickname,
            COUNT(c.id) as comment_count
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN comments c ON p.id = c.post_id
        WHERE p.category = ?
        GROUP BY p.id, p.user_id, p.title, p.content, p.category, p.created_at, u.nickname
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := DB.Query(query, category, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts by category: %w", err)
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		err := rows.Scan(
			&post.ID, &post.UserID, &post.Title, &post.Content, &post.Category, &post.CreatedAt,
			&post.UserNickname, &post.CommentCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}

	return posts, nil
}
