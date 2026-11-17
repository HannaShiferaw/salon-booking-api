package services

import (
	"errors"
	"time"

	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/utils"

	"github.com/google/uuid"
)

const (
	salonOpenMin  = 9 * 60  // 09:00
	salonCloseMin = 18 * 60 // 18:00
	slotStepMin   = 30
)

var ErrSlotUnavailable = errors.New("that time slot is no longer available")

// AvailabilityService computes bookable time slots and enforces the
// no-double-booking rule. All checks live here so handlers cannot bypass them.
type AvailabilityService struct {
	store *repositories.Store
}

func NewAvailabilityService(store *repositories.Store) *AvailabilityService {
	return &AvailabilityService{store: store}
}

// AvailableSlots returns start times ("HH:MM") a service can be booked on a
// date. If staffID is nil, a slot counts as available if ANY staff member
// who can do the service is free then.
func (s *AvailabilityService) AvailableSlots(service *models.Service, staffID *uuid.UUID, date string) ([]string, error) {
	day, ok := utils.ParseDate(date)
	if !ok {
		return nil, errors.New("date must be YYYY-MM-DD")
	}
	// Past dates have no slots.
	today := time.Now().Format("2006-01-02")
	if date < today {
		return []string{}, nil
	}
	duration := service.DurationMinutes
	if duration <= 0 {
		duration = 30
	}
	var staffList []models.Staff
	if staffID != nil {
		st, err := s.store.FindStaff(*staffID)
		if err != nil {
			return nil, errors.New("staff member not found")
		}
		if !st.IsActive {
			return []string{}, nil
		}
		staffList = []models.Staff{*st}
	} else {
		list, err := s.store.StaffForService(service.ID)
		if err != nil {
			return nil, err
		}
		staffList = list
	}
	if len(staffList) == 0 {
		return []string{}, nil
	}
	var slots []string
	for start := salonOpenMin; start+duration <= salonCloseMin; start += slotStepMin {
		// Skip slots already in the past today.
		if date == today {
			nowMin := time.Now().Hour()*60 + time.Now().Minute()
			if start <= nowMin {
				continue
			}
		}
		for _, st := range staffList {
			free, err := s.isStaffFree(st.ID, date, day, start, start+duration)
			if err != nil {
				return nil, err
			}
			if free {
				slots = append(slots, utils.FromMinutes(start))
				break
			}
		}
	}
	if slots == nil {
		slots = []string{}
	}
	return slots, nil
}

// IsSlotAvailable checks one concrete staff/date/time against every rule.
func (s *AvailabilityService) IsSlotAvailable(staffID uuid.UUID, date string, startMin, duration int) (bool, error) {
	day, ok := utils.ParseDate(date)
	if !ok {
		return false, errors.New("date must be YYYY-MM-DD")
	}
	return s.isStaffFree(staffID, date, day, startMin, startMin+duration)
}

// isStaffFree checks schedule, blocked dates and overlapping appointments.
func (s *AvailabilityService) isStaffFree(staffID uuid.UUID, date string, day time.Time, startMin, endMin int) (bool, error) {
	// Staff schedule for this weekday.
	var sched models.StaffSchedule
	err := s.store.DB.Where("staff_id = ? AND weekday = ?", staffID, int(day.Weekday())).First(&sched).Error
	if err == nil {
		if sched.IsDayOff {
			return false, nil
		}
		schedStart, ok1 := utils.ToMinutes(sched.StartTime)
		schedEnd, ok2 := utils.ToMinutes(sched.EndTime)
		if ok1 && ok2 && (startMin < schedStart || endMin > schedEnd) {
			return false, nil
		}
	}
	// Blocked dates: salon-wide (staff_id null) or this staff member.
	var blocked []models.BlockedDate
	if err := s.store.DB.Where("date = ? AND (staff_id IS NULL OR staff_id = ?)", date, staffID).Find(&blocked).Error; err != nil {
		return false, err
	}
	for _, b := range blocked {
		if b.StartTime == nil || b.EndTime == nil {
			return false, nil // whole day blocked
		}
		bs, ok1 := utils.ToMinutes(*b.StartTime)
		be, ok2 := utils.ToMinutes(*b.EndTime)
		if ok1 && ok2 && utils.Overlaps(startMin, endMin, bs, be) {
			return false, nil
		}
	}
	// Overlapping active appointments.
	apps, err := s.store.ActiveAppointmentsForStaff(staffID, date)
	if err != nil {
		return false, err
	}
	for _, a := range apps {
		as, ok1 := utils.ToMinutes(a.StartTime)
		ae, ok2 := utils.ToMinutes(a.EndTime)
		if ok1 && ok2 && utils.Overlaps(startMin, endMin, as, ae) {
			return false, nil
		}
	}
	return true, nil
}

// FindAvailableStaff returns the first staff member who can do the service
// and is free at the requested slot (used for "no preference" bookings).
func (s *AvailabilityService) FindAvailableStaff(service *models.Service, date string, startMin int) (*models.Staff, error) {
	list, err := s.store.StaffForService(service.ID)
	if err != nil {
		return nil, err
	}
	day, ok := utils.ParseDate(date)
	if !ok {
		return nil, errors.New("date must be YYYY-MM-DD")
	}
	for _, st := range list {
		free, err := s.isStaffFree(st.ID, date, day, startMin, startMin+service.DurationMinutes)
		if err != nil {
			return nil, err
		}
		if free {
			c := st
			return &c, nil
		}
	}
	return nil, nil
}
