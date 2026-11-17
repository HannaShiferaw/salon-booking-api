package services

import (
	"errors"
	"time"

	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/utils"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppointmentService owns booking rules: validation, slot re-checking,
// price snapshots, cancellation and rescheduling.
type AppointmentService struct {
	store *repositories.Store
	avail *AvailabilityService
}

func NewAppointmentService(store *repositories.Store, avail *AvailabilityService) *AppointmentService {
	return &AppointmentService{store: store, avail: avail}
}

type CreateInput struct {
	CustomerID uuid.UUID
	ServiceID  uuid.UUID
	StaffID    *uuid.UUID
	Date       string
	StartTime  string
	Notes      string
}

func (s *AppointmentService) Create(in CreateInput) (*models.Appointment, error) {
	svc, err := s.store.FindService(in.ServiceID)
	if err != nil {
		return nil, errors.New("service not found")
	}
	if !svc.IsActive {
		return nil, errors.New("this service is currently unavailable")
	}
	day, ok := utils.ParseDate(in.Date)
	if !ok {
		return nil, errors.New("date must be YYYY-MM-DD")
	}
	if in.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("cannot book a date in the past")
	}
	startMin, ok := utils.ToMinutes(in.StartTime)
	if !ok {
		return nil, errors.New("start_time must be HH:MM")
	}
	if startMin < salonOpenMin || startMin+svc.DurationMinutes > salonCloseMin {
		return nil, errors.New("please choose a time within salon hours (09:00-18:00)")
	}
	_ = day

	// Resolve staff: explicit choice, or auto-assign first available.
	var staffID uuid.UUID
	if in.StaffID != nil {
		st, err := s.store.FindStaff(*in.StaffID)
		if err != nil {
			return nil, errors.New("staff member not found")
		}
		if !st.IsActive {
			return nil, errors.New("that staff member is not available")
		}
		can, err := s.store.StaffCanDoService(st.ID, svc.ID)
		if err != nil {
			return nil, err
		}
		if !can {
			return nil, errors.New("that staff member does not offer this service")
		}
		staffID = st.ID
	} else {
		found, err := s.avail.FindAvailableStaff(svc, in.Date, startMin)
		if err != nil {
			return nil, err
		}
		if found == nil {
			return nil, ErrSlotUnavailable
		}
		staffID = found.ID
	}

	// Final availability re-check (the critical double-booking guard).
	free, err := s.avail.IsSlotAvailable(staffID, in.Date, startMin, svc.DurationMinutes)
	if err != nil {
		return nil, err
	}
	if !free {
		return nil, ErrSlotUnavailable
	}

	appt := &models.Appointment{
		ID: uuid.New(), CustomerID: in.CustomerID, ServiceID: svc.ID, StaffID: &staffID,
		Date: in.Date, StartTime: in.StartTime, EndTime: utils.FromMinutes(startMin + svc.DurationMinutes),
		Status: models.StatusPending, Notes: in.Notes, PriceCents: svc.PriceCents,
	}
	// Create inside a transaction and re-check overlap atomically-ish: the
	// overlap query runs in the same transaction so concurrent requests
	// cannot both slip through on SQLite/Postgres serialisable reads.
	err = s.store.DB.Transaction(func(tx *gorm.DB) error {
		var existing []models.Appointment
		if err := tx.Where("staff_id = ? AND date = ? AND status IN ?", staffID, in.Date, []string{models.StatusPending, models.StatusConfirmed}).Find(&existing).Error; err != nil {
			return err
		}
		for _, a := range existing {
			as, ok1 := utils.ToMinutes(a.StartTime)
			ae, ok2 := utils.ToMinutes(a.EndTime)
			if ok1 && ok2 && utils.Overlaps(startMin, startMin+svc.DurationMinutes, as, ae) {
				return ErrSlotUnavailable
			}
		}
		return tx.Create(appt).Error
	})
	if err != nil {
		return nil, err
	}
	return s.store.FindAppointment(appt.ID)
}

// Cancel cancels an appointment. Customers may only cancel more than 24h
// ahead; admins may always cancel.
func (s *AppointmentService) Cancel(appt *models.Appointment, isAdmin bool) error {
	if appt.Status == models.StatusCancelled {
		return errors.New("appointment is already cancelled")
	}
	if appt.Status == models.StatusCompleted {
		return errors.New("completed appointments cannot be cancelled")
	}
	if !isAdmin {
		start, err := time.Parse("2006-01-02 15:04", appt.Date+" "+appt.StartTime)
		if err == nil && time.Until(start) < 24*time.Hour {
			return errors.New("appointments can only be cancelled more than 24 hours in advance")
		}
	}
	appt.Status = models.StatusCancelled
	return s.store.DB.Save(appt).Error
}

// Reschedule moves an appointment after re-checking availability.
func (s *AppointmentService) Reschedule(appt *models.Appointment, date, startTime string) (*models.Appointment, error) {
	if appt.Status == models.StatusCancelled || appt.Status == models.StatusCompleted {
		return nil, errors.New("cancelled or completed appointments cannot be rescheduled")
	}
	svc, err := s.store.FindService(appt.ServiceID)
	if err != nil {
		return nil, err
	}
	if _, ok := utils.ParseDate(date); !ok {
		return nil, errors.New("date must be YYYY-MM-DD")
	}
	if date < time.Now().Format("2006-01-02") {
		return nil, errors.New("cannot move to a date in the past")
	}
	startMin, ok := utils.ToMinutes(startTime)
	if !ok {
		return nil, errors.New("start_time must be HH:MM")
	}
	// Temporarily ignore this appointment's own slot by checking other staff
	// bookings: if the staff/date/time equals the current one, allow it.
	if appt.StaffID == nil {
		return nil, errors.New("appointment has no staff assigned")
	}
	apps, err := s.store.ActiveAppointmentsForStaff(*appt.StaffID, date)
	if err != nil {
		return nil, err
	}
	for _, a := range apps {
		if a.ID == appt.ID {
			continue
		}
		as, ok1 := utils.ToMinutes(a.StartTime)
		ae, ok2 := utils.ToMinutes(a.EndTime)
		if ok1 && ok2 && utils.Overlaps(startMin, startMin+svc.DurationMinutes, as, ae) {
			return nil, ErrSlotUnavailable
		}
	}
	// IsSlotAvailable includes this appointment itself, so only use it
	// when the new slot does not overlap the current one; the manual loop
	// above already cleared every *other* booking.
	oldStart, _ := utils.ToMinutes(appt.StartTime)
	oldEnd, _ := utils.ToMinutes(appt.EndTime)
	if !utils.Overlaps(startMin, startMin+svc.DurationMinutes, oldStart, oldEnd) || date != appt.Date {
		free, err := s.avail.IsSlotAvailable(*appt.StaffID, date, startMin, svc.DurationMinutes)
		if err != nil {
			return nil, err
		}
		if !free {
			// The only appointment that could make this look busy is this
			// one, already excluded above, so a busy result here means a
			// real conflict (schedule, blocked date, or another booking).
			// Re-check excluding self to distinguish: if no other booking
			// overlaps, the block must be schedule/blocked.
			return nil, ErrSlotUnavailable
		}
	}
	appt.Date = date
	appt.StartTime = startTime
	appt.EndTime = utils.FromMinutes(startMin + svc.DurationMinutes)
	if err := s.store.DB.Save(appt).Error; err != nil {
		return nil, err
	}
	return s.store.FindAppointment(appt.ID)
}

// SetStatus changes status (admin only; validated by the handler).
func (s *AppointmentService) SetStatus(appt *models.Appointment, status string) error {
	valid := false
	for _, v := range models.AllStatuses {
		if v == status {
			valid = true
		}
	}
	if !valid {
		return errors.New("invalid status")
	}
	appt.Status = status
	return s.store.DB.Save(appt).Error
}
