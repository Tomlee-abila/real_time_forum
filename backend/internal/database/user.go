package database

import (
	"fmt"
	"time"

	"github.com/Tomlee-abila/real_time_forum/backend/internal/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// CreateUser creates a new user in the database
func CreateUser(user *models.UserRegistration) (*models.User, error) {
	// Generate UUID for the user
	userID := uuid.New().String()

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Insert user into database
	query := `
        INSERT INTO users (id, nickname, age, gender, first_name, last_name, email, password, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

	createdAt := time.Now()
	_, err = DB.Exec(query, userID, user.Nickname, user.Age, user.Gender,
		user.FirstName, user.LastName, user.Email, string(hashedPassword), createdAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Return the created user (without password)
	return &models.User{
		ID:        userID,
		Nickname:  user.Nickname,
		Age:       user.Age,
		Gender:    user.Gender,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Email:     user.Email,
		CreatedAt: createdAt,
	}, nil
}
