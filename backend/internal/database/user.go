package database

import (
	"database/sql"
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

// GetUserByEmail retrieves a user by email
func GetUserByEmail(email string) (*models.User, error) {
	query := `
        SELECT id, nickname, age, gender, first_name, last_name, email, password, created_at
        FROM users WHERE email = ?
    `

	var user models.User
	err := DB.QueryRow(query, email).Scan(
		&user.ID, &user.Nickname, &user.Age, &user.Gender,
		&user.FirstName, &user.LastName, &user.Email, &user.Password, &user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetUserByNickname retrieves a user by nickname
func GetUserByNickname(nickname string) (*models.User, error) {
	query := `
        SELECT id, nickname, age, gender, first_name, last_name, email, password, created_at
        FROM users WHERE nickname = ?
    `

	var user models.User
	err := DB.QueryRow(query, nickname).Scan(
		&user.ID, &user.Nickname, &user.Age, &user.Gender,
		&user.FirstName, &user.LastName, &user.Email, &user.Password, &user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(userID string) (*models.User, error) {
	query := `
        SELECT id, nickname, age, gender, first_name, last_name, email, created_at
        FROM users WHERE id = ?
    `

	var user models.User
	err := DB.QueryRow(query, userID).Scan(
		&user.ID, &user.Nickname, &user.Age, &user.Gender,
		&user.FirstName, &user.LastName, &user.Email, &user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// ValidateUserCredentials checks if the provided credentials are valid
func ValidateUserCredentials(emailOrNickname, password string) (*models.User, error) {
	var user *models.User
	var err error

	// Try to find user by email first, then by nickname
	if isValidEmail(emailOrNickname) {
		user, err = GetUserByEmail(emailOrNickname)
	} else {
		user, err = GetUserByNickname(emailOrNickname)
	}

	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Clear password before returning
	user.Password = ""
	return user, nil
}

// CheckEmailExists checks if an email already exists
func CheckEmailExists(email string) (bool, error) {
	query := "SELECT COUNT(*) FROM users WHERE email = ?"
	var count int
	err := DB.QueryRow(query, email).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check email: %w", err)
	}
	return count > 0, nil
}

// CheckNicknameExists checks if a nickname already exists
func CheckNicknameExists(nickname string) (bool, error) {
	query := "SELECT COUNT(*) FROM users WHERE nickname = ?"
	var count int
	err := DB.QueryRow(query, nickname).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check nickname: %w", err)
	}
	return count > 0, nil
}

// Helper function to validate email format
func isValidEmail(email string) bool {
	// Simple email validation - you can use the same regex from models
	return len(email) > 0 && len(email) < 255 &&
		len(email) > 3 && email[len(email)-1] != '.' &&
		email[0] != '.' && email[0] != '@'
}
