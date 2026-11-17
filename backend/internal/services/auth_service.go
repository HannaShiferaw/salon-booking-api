package services

import (
	"errors"

	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/utils"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrDuplicateEmail  = errors.New("an account with this email already exists")
	ErrInvalidLogin    = errors.New("invalid email or password")
	ErrInactiveAccount = errors.New("account is deactivated")
)

// AuthService handles registration and login.
type AuthService struct {
	store *repositories.Store
}

func NewAuthService(store *repositories.Store) *AuthService { return &AuthService{store: store} }

func (s *AuthService) Register(fullName, email, phone, password string) (*models.User, error) {
	if !utils.IsValidEmail(email) {
		return nil, errors.New("please enter a valid email address")
	}
	if len(fullName) < 2 {
		return nil, errors.New("full name is required")
	}
	if !utils.IsValidPassword(password) {
		return nil, errors.New("password must be at least 8 characters")
	}
	if _, err := s.store.FindUserByEmail(email); err == nil {
		return nil, ErrDuplicateEmail
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u := &models.User{ID: uuid.New(), FullName: fullName, Email: email, Phone: phone, PasswordHash: string(hash), Role: models.RoleCustomer, IsActive: true}
	if err := s.store.CreateUser(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *AuthService) Login(email, password string) (*models.User, error) {
	u, err := s.store.FindUserByEmail(email)
	if err != nil {
		return nil, ErrInvalidLogin
	}
	if !u.IsActive {
		return nil, ErrInactiveAccount
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidLogin
	}
	return u, nil
}
