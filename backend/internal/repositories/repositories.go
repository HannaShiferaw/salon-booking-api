package repositories

import (
	"blush-salon/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Store bundles the database handle used by all repositories.
type Store struct {
	DB *gorm.DB
}

func New(db *gorm.DB) *Store { return &Store{DB: db} }

// --- users ---

func (s *Store) FindUserByEmail(email string) (*models.User, error) {
	var u models.User
	if err := s.DB.Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) FindUserByID(id uuid.UUID) (*models.User, error) {
	var u models.User
	if err := s.DB.First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) CreateUser(u *models.User) error { return s.DB.Create(u).Error }

// --- services ---

func (s *Store) ListServices(category string, activeOnly bool) ([]models.Service, error) {
	var out []models.Service
	q := s.DB.Order("category, name")
	if category != "" {
		q = q.Where("category = ?", category)
	}
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	return out, q.Find(&out).Error
}

func (s *Store) FindService(id uuid.UUID) (*models.Service, error) {
	var svc models.Service
	if err := s.DB.First(&svc, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &svc, nil
}

// --- staff ---

func (s *Store) ListStaff(activeOnly bool) ([]models.Staff, error) {
	var out []models.Staff
	q := s.DB.Preload("Services").Order("name")
	if activeOnly {
		q = q.Where("is_active = ?", true)
	}
	return out, q.Find(&out).Error
}

func (s *Store) FindStaff(id uuid.UUID) (*models.Staff, error) {
	var st models.Staff
	if err := s.DB.Preload("Services").First(&st, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &st, nil
}

// StaffCanDoService reports whether a staff member is linked to a service.
func (s *Store) StaffCanDoService(staffID, serviceID uuid.UUID) (bool, error) {
	var n int64
	err := s.DB.Model(&models.StaffService{}).Where("staff_id = ? AND service_id = ?", staffID, serviceID).Count(&n).Error
	return n > 0, err
}

// StaffForService returns active staff who can perform a service.
func (s *Store) StaffForService(serviceID uuid.UUID) ([]models.Staff, error) {
	var out []models.Staff
	err := s.DB.Joins("JOIN staff_services ON staff_services.staff_id = staffs.id").
		Where("staff_services.service_id = ? AND staffs.is_active = ?", serviceID, true).
		Order("staffs.name").Find(&out).Error
	return out, err
}

// --- appointments ---

func (s *Store) FindAppointment(id uuid.UUID) (*models.Appointment, error) {
	var a models.Appointment
	if err := s.DB.Preload("Customer").Preload("Service").Preload("Staff").First(&a, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// ActiveAppointmentsForStaff returns non-cancelled appointments for a staff
// member on a date (used for overlap checks).
func (s *Store) ActiveAppointmentsForStaff(staffID uuid.UUID, date string) ([]models.Appointment, error) {
	var out []models.Appointment
	err := s.DB.Where("staff_id = ? AND date = ? AND status IN ?", staffID, date, []string{models.StatusPending, models.StatusConfirmed}).
		Find(&out).Error
	return out, err
}
