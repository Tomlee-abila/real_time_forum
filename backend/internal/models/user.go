package models

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

// User represents a user in the system
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

// UserRegistration represents the data needed for user registration
type UserRegistration struct {
	Nickname  string `json:"nickname"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

// UserLogin represents the data needed for user login
type UserLogin struct {
	EmailOrNickname string `json:"email_or_nickname"`
	Password        string `json:"password"`
}

// Validate validates the user registration data
func (ur *UserRegistration) Validate() error {
	// Validate nickname
	if strings.TrimSpace(ur.Nickname) == "" {
		return errors.New("nickname is required")
	}
	if len(ur.Nickname) < 3 || len(ur.Nickname) > 20 {
		return errors.New("nickname must be between 3 and 20 characters")
	}

	// Validate age
	if ur.Age < 13 || ur.Age > 120 {
		return errors.New("age must be between 13 and 120")
	}

	// Validate gender
	validGenders := []string{"male", "female", "other"}
	if !Contains(validGenders, strings.ToLower(ur.Gender)) {
		return errors.New("gender must be male, female, or other")
	}

	// Validate first name
	if strings.TrimSpace(ur.FirstName) == "" {
		return errors.New("first name is required")
	}
	if len(ur.FirstName) > 50 {
		return errors.New("first name must be less than 50 characters")
	}

	// Validate last name
	if strings.TrimSpace(ur.LastName) == "" {
		return errors.New("last name is required")
	}
	if len(ur.LastName) > 50 {
		return errors.New("last name must be less than 50 characters")
	}

	// Validate email
	if !isValidEmail(ur.Email) {
		return errors.New("invalid email format")
	}

	// Validate password
	if len(ur.Password) < 6 {
		return errors.New("password must be at least 6 characters long")
	}

	return nil
}

// Validate validates the user login data
func (ul *UserLogin) Validate() error {
	if strings.TrimSpace(ul.EmailOrNickname) == "" {
		return errors.New("email or nickname is required")
	}
	if strings.TrimSpace(ul.Password) == "" {
		return errors.New("password is required")
	}
	return nil
}

// Helper functions
func Contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}
