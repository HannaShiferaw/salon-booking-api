package tests

import (
	"testing"
	"time"

	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/services"
	"blush-salon/backend/internal/utils"

	"github.com/google/uuid"
)

func TestOverlapLogic(t *testing.T) {
	// Touching endpoints do not overlap; any real overlap does.
	if utils.Overlaps(600, 660, 660, 720) {
		t.Fatal("touching slots should not overlap")
	}
	if !utils.Overlaps(600, 660, 630, 690) {
		t.Fatal("partial overlap should be detected")
	}
	if !utils.Overlaps(600, 660, 600, 660) {
		t.Fatal("identical slots should overlap")
	}
	if utils.Overlaps(600, 660, 700, 760) {
		t.Fatal("separate slots should not overlap")
	}
}

func TestDoubleBookingPrevention(t *testing.T) {
	store := testStore(t)
	avail := services.NewAvailabilityService(store)
	apptSvc := services.NewAppointmentService(store, avail)
	db := store.DB

	// Minimal fixture: one service, one staff member who offers it.
	svc := models.Service{Name: "Test Haircut", Category: models.CategoryHair, Price: 35, DurationMinutes: 60, IsActive: true}
	if err := db.Create(&svc).Error; err != nil {
		t.Fatal(err)
	}
	st := models.Staff{Name: "Test Stylist", Title: "Stylist", IsActive: true}
	if err := db.Create(&st).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Create(&models.StaffService{StaffID: st.ID, ServiceID: svc.ID}).Error; err != nil {
		t.Fatal(err)
	}
	// Working every day 09:00-18:00.
	for wd := 0; wd <= 6; wd++ {
		_ = db.Create(&models.StaffSchedule{StaffID: st.ID, Weekday: wd, StartTime: "09:00", EndTime: "18:00"}).Error
	}
	customerID := uuid.New()
	// Use a future weekday date.
	date := time.Now().AddDate(0, 0, 2).Format("2006-01-02")

	first, err := apptSvc.Create(services.CreateInput{CustomerID: customerID, ServiceID: svc.ID, StaffID: &st.ID, Date: date, StartTime: "10:00"})
	if err != nil {
		t.Fatalf("first booking: %v", err)
	}
	if first.EndTime != "11:00" {
		t.Fatalf("expected end 11:00, got %s", first.EndTime)
	}
	if first.Price != 35 {
		t.Fatalf("expected price snapshot 35, got %v", first.Price)
	}

	// Same staff, overlapping time must be rejected with 409-style error.
	if _, err := apptSvc.Create(services.CreateInput{CustomerID: uuid.New(), ServiceID: svc.ID, StaffID: &st.ID, Date: date, StartTime: "10:30"}); err == nil {
		t.Fatal("expected overlapping booking to fail")
	}
	// Same staff, non-overlapping time must succeed.
	if _, err := apptSvc.Create(services.CreateInput{CustomerID: uuid.New(), ServiceID: svc.ID, StaffID: &st.ID, Date: date, StartTime: "11:00"}); err != nil {
		t.Fatalf("back-to-back booking should succeed: %v", err)
	}
	// Past date must fail.
	if _, err := apptSvc.Create(services.CreateInput{CustomerID: customerID, ServiceID: svc.ID, StaffID: &st.ID, Date: "2020-01-01", StartTime: "10:00"}); err == nil {
		t.Fatal("expected past date to fail")
	}
	// Inactive service must fail.
	_ = db.Model(&svc).Update("is_active", false).Error
	if _, err := apptSvc.Create(services.CreateInput{CustomerID: customerID, ServiceID: svc.ID, StaffID: &st.ID, Date: date, StartTime: "14:00"}); err == nil {
		t.Fatal("expected inactive service to fail")
	}
	_ = db.Model(&svc).Update("is_active", true).Error

	// Slots must exclude the booked 10:00 slot (60-min service).
	slots, err := avail.AvailableSlots(&svc, &st.ID, date)
	if err != nil {
		t.Fatal(err)
	}
	for _, s := range slots {
		if s == "10:00" || s == "10:30" {
			t.Fatalf("slot %s should be unavailable after booking", s)
		}
	}
	found11 := false
	for _, s := range slots {
		if s == "11:00" {
			// 11:00 is taken by the second booking, so it must NOT appear.
			t.Fatal("slot 11:00 should be unavailable after second booking")
		}
		if s == "12:00" {
			found11 = true
		}
	}
	if !found11 {
		t.Fatal("slot 12:00 should be available")
	}

	// No-preference booking auto-assigns the free staff member.
	_ = repositories.New(db) // keep store wiring exercised
	if _, err := apptSvc.Create(services.CreateInput{CustomerID: customerID, ServiceID: svc.ID, Date: date, StartTime: "14:00"}); err != nil {
		t.Fatalf("no-preference booking: %v", err)
	}
}
