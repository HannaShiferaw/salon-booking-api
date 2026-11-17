package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	RoleCustomer = "customer"
	RoleAdmin    = "admin"
)

// User is a customer or an admin. PasswordHash is never serialised.
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	FullName     string    `gorm:"size:120;not null" json:"full_name"`
	Email        string    `gorm:"size:180;uniqueIndex;not null" json:"email"`
	Phone        string    `gorm:"size:40" json:"phone"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Role         string    `gorm:"size:20;not null;default:customer;index" json:"role"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// PublicUser is the safe shape returned by customer-facing endpoints.
type PublicUser struct {
	ID       uuid.UUID `json:"id"`
	FullName string    `json:"full_name"`
	Email    string    `json:"email"`
	Phone    string    `json:"phone"`
	Role     string    `json:"role"`
}

func (u *User) Public() PublicUser {
	return PublicUser{ID: u.ID, FullName: u.FullName, Email: u.Email, Phone: u.Phone, Role: u.Role}
}
