package services

import (
	"time"

	"gorm.io/gorm"

	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
)

// AdminStats is the dashboard overview payload.
type AdminStats struct {
	TodayAppointments     int64 `json:"today_appointments"`
	UpcomingAppointments  int64 `json:"upcoming_appointments"`
	TotalCustomers        int64 `json:"total_customers"`
	PendingAppointments   int64 `json:"pending_appointments"`
	ConfirmedAppointments int64 `json:"confirmed_appointments"`
	TotalAppointments     int64 `json:"total_appointments"`
	RevenueCents          int64 `json:"revenue_cents"`
}

// AdminService provides dashboard statistics.
type AdminService struct {
	store *repositories.Store
}

func NewAdminService(store *repositories.Store) *AdminService { return &AdminService{store: store} }

func (s *AdminService) Stats() (*AdminStats, error) {
	today := time.Now().Format("2006-01-02")
	stats := &AdminStats{}
	appt := func() *gorm.DB { return s.store.DB.Model(&models.Appointment{}) }
	if err := appt().Where("date = ? AND status IN ?", today, []string{models.StatusPending, models.StatusConfirmed}).Count(&stats.TodayAppointments).Error; err != nil {
		return nil, err
	}
	if err := appt().Where("date >= ? AND status IN ?", today, []string{models.StatusPending, models.StatusConfirmed}).Count(&stats.UpcomingAppointments).Error; err != nil {
		return nil, err
	}
	if err := s.store.DB.Model(&models.User{}).Where("role = ?", models.RoleCustomer).Count(&stats.TotalCustomers).Error; err != nil {
		return nil, err
	}
	if err := appt().Where("status = ?", models.StatusPending).Count(&stats.PendingAppointments).Error; err != nil {
		return nil, err
	}
	if err := appt().Where("status = ?", models.StatusConfirmed).Count(&stats.ConfirmedAppointments).Error; err != nil {
		return nil, err
	}
	if err := appt().Count(&stats.TotalAppointments).Error; err != nil {
		return nil, err
	}
	// Revenue from completed appointments.
	var revenue *int64
	if err := s.store.DB.Model(&models.Appointment{}).Where("status = ?", models.StatusCompleted).Select("COALESCE(SUM(price_cents),0)").Scan(&revenue).Error; err == nil && revenue != nil {
		stats.RevenueCents = *revenue
	}
	return stats, nil
}
