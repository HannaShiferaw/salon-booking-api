package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	StatusPending   = "pending"
	StatusConfirmed = "confirmed"
	StatusCompleted = "completed"
	StatusCancelled = "cancelled"
	StatusNoShow    = "no_show"
)

// AllStatuses lists every valid appointment status.
var AllStatuses = []string{StatusPending, StatusConfirmed, StatusCompleted, StatusCancelled, StatusNoShow}

// IsActiveStatus reports whether an appointment occupies a time slot.
func IsActiveStatus(s string) bool {
	return s == StatusPending || s == StatusConfirmed
}

// Appointment is one booking. Date is YYYY-MM-DD, times are "HH:MM".
// EndTime is computed from the service duration at creation.
type Appointment struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	CustomerID uuid.UUID  `gorm:"type:uuid;not null;index" json:"customer_id"`
	Customer   *User      `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	ServiceID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"service_id"`
	Service    *Service   `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
	StaffID    *uuid.UUID `gorm:"type:uuid;index" json:"staff_id"`
	Staff      *Staff     `gorm:"foreignKey:StaffID" json:"staff,omitempty"`
	Date       string     `gorm:"size:10;not null;index" json:"date"`
	StartTime  string     `gorm:"size:5;not null" json:"start_time"`
	EndTime    string     `gorm:"size:5;not null" json:"end_time"`
	Status     string     `gorm:"size:20;not null;default:pending;index" json:"status"`
	Notes      string     `gorm:"size:1000" json:"notes"`
	PriceCents int        `gorm:"not null" json:"-"`
	Price      float64    `gorm:"-" json:"price"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func (a *Appointment) BeforeCreate(_ *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	a.syncPrice()
	return nil
}

func (a *Appointment) BeforeSave(_ *gorm.DB) error { a.syncPrice(); return nil }
func (a *Appointment) AfterFind(_ *gorm.DB) error {
	a.Price = float64(a.PriceCents) / 100
	return nil
}

func (a *Appointment) syncPrice() {
	if a.Price != 0 {
		a.PriceCents = int(a.Price*100 + 0.5)
	}
}
