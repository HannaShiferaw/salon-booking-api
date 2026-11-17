package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	CategoryHair   = "hair"
	CategoryNails  = "nails"
	CategoryBeauty = "beauty"
	CategorySkin   = "skin"
)

// Service is a bookable salon service. Prices are stored as integer cents
// and exposed as dollars in the Price field (see hooks below).
type Service struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name            string    `gorm:"size:120;not null" json:"name"`
	Description     string    `gorm:"size:1000" json:"description"`
	Category        string    `gorm:"size:30;not null;index" json:"category"`
	PriceCents      int       `gorm:"not null" json:"-"`
	Price           float64   `gorm:"-" json:"price"`
	DurationMinutes int       `gorm:"not null" json:"duration_minutes"`
	Icon            string    `gorm:"size:40" json:"icon"`
	IsActive        bool      `gorm:"default:true;index" json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (s *Service) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	s.syncPrice()
	return nil
}

func (s *Service) BeforeSave(_ *gorm.DB) error { s.syncPrice(); return nil }
func (s *Service) AfterFind(_ *gorm.DB) error  { s.Price = float64(s.PriceCents) / 100; return nil }

func (s *Service) syncPrice() {
	if s.Price != 0 {
		s.PriceCents = int(s.Price*100 + 0.5)
	}
}

// Staff is a salon team member.
type Staff struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string    `gorm:"size:120;not null" json:"name"`
	Title     string    `gorm:"size:120" json:"title"`
	Bio       string    `gorm:"size:1000" json:"bio"`
	AvatarURL string    `gorm:"size:500" json:"avatar_url"`
	IsActive  bool      `gorm:"default:true;index" json:"is_active"`
	Services  []Service `gorm:"many2many:staff_services;" json:"services,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *Staff) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// StaffService is the join table linking staff to the services they perform.
type StaffService struct {
	StaffID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"staff_id"`
	ServiceID uuid.UUID `gorm:"type:uuid;primaryKey" json:"service_id"`
}

// StaffSchedule is one staff member's working hours for a weekday (0=Sunday).
type StaffSchedule struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	StaffID   uuid.UUID `gorm:"type:uuid;not null;index" json:"staff_id"`
	Weekday   int       `gorm:"not null;index" json:"weekday"`
	StartTime string    `gorm:"size:5;not null" json:"start_time"` // "09:00"
	EndTime   string    `gorm:"size:5;not null" json:"end_time"`   // "18:00"
	IsDayOff  bool      `gorm:"default:false" json:"is_day_off"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (s *StaffSchedule) BeforeCreate(_ *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// BlockedDate blocks a date (whole day, or a time range) for the whole salon
// (StaffID nil) or for one staff member.
type BlockedDate struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Date      string     `gorm:"size:10;not null;index" json:"date"` // YYYY-MM-DD
	StaffID   *uuid.UUID `gorm:"type:uuid;index" json:"staff_id"`
	Reason    string     `gorm:"size:255" json:"reason"`
	StartTime *string    `gorm:"size:5" json:"start_time"` // nil = whole day
	EndTime   *string    `gorm:"size:5" json:"end_time"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (b *BlockedDate) BeforeCreate(_ *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

// SalonSetting is a simple key/value store for salon-wide settings.
type SalonSetting struct {
	Key       string    `gorm:"size:100;primaryKey" json:"key"`
	Value     string    `gorm:"size:1000" json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}
