package database

import (
	"time"

	"blush-salon/backend/internal/config"
	"blush-salon/backend/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Seed creates demo users, services, staff and a few future appointments.
// It is idempotent: running it twice does not duplicate data.
func Seed(db *gorm.DB, cfg *config.Config) error {
	// --- users ---
	admin, err := ensureUser(db, cfg.AdminEmail, "Blush Admin", "+251911000001", models.RoleAdmin, cfg.AdminPass)
	if err != nil {
		return err
	}
	_ = admin
	customer, err := ensureUser(db, "demo@blushsalon.com", "Demo Customer", "+251911000002", models.RoleCustomer, "Demo123!")
	if err != nil {
		return err
	}

	// --- services ---
	services := []models.Service{
		{Name: "Signature Haircut", Description: "Consultation, wash, precision cut and blow-dry finish.", Category: models.CategoryHair, Price: 35, DurationMinutes: 45, Icon: "scissors"},
		{Name: "Blowout & Styling", Description: "Smooth, voluminous blow-dry and styling for any occasion.", Category: models.CategoryHair, Price: 30, DurationMinutes: 30, Icon: "wind"},
		{Name: "Hair Coloring", Description: "Full colour with premium products and a conditioning finish.", Category: models.CategoryHair, Price: 85, DurationMinutes: 120, Icon: "palette"},
		{Name: "Balayage", Description: "Hand-painted highlights for a soft, sun-kissed blend.", Category: models.CategoryHair, Price: 120, DurationMinutes: 150, Icon: "sparkles"},
		{Name: "Deep Hair Treatment", Description: "Restorative mask, scalp massage and steam therapy.", Category: models.CategoryHair, Price: 50, DurationMinutes: 60, Icon: "droplet"},
		{Name: "Classic Manicure", Description: "Shape, cuticle care, polish and a relaxing hand massage.", Category: models.CategoryNails, Price: 25, DurationMinutes: 45, Icon: "hand"},
		{Name: "Luxury Pedicure", Description: "Soak, exfoliation, massage and polish for happy feet.", Category: models.CategoryNails, Price: 35, DurationMinutes: 60, Icon: "footprints"},
		{Name: "Gel Nails", Description: "Long-lasting gel colour with a glossy, chip-free finish.", Category: models.CategoryNails, Price: 45, DurationMinutes: 75, Icon: "gem"},
		{Name: "Nail Art", Description: "Custom designs, gems and hand-painted art on gel or polish.", Category: models.CategoryNails, Price: 55, DurationMinutes: 90, Icon: "brush"},
		{Name: "Glow Facial", Description: "Cleanse, exfoliation, mask and moisturise for radiant skin.", Category: models.CategorySkin, Price: 65, DurationMinutes: 60, Icon: "flower"},
		{Name: "Occasion Makeup", Description: "Full-face makeup for weddings, parties and photoshoots.", Category: models.CategoryBeauty, Price: 70, DurationMinutes: 60, Icon: "wand"},
		{Name: "Eyebrow Shaping", Description: "Precise shaping and tinting to frame your face.", Category: models.CategoryBeauty, Price: 20, DurationMinutes: 30, Icon: "eye"},
		{Name: "Eyelash Extensions", Description: "Natural-looking volume lashes, applied lash by lash.", Category: models.CategoryBeauty, Price: 90, DurationMinutes: 90, Icon: "eye"},
	}
	byName := map[string]models.Service{}
	for _, s := range services {
		var existing models.Service
		if err := db.Where("name = ?", s.Name).First(&existing).Error; err != nil {
			if err := db.Create(&s).Error; err != nil {
				return err
			}
			byName[s.Name] = s
		} else {
			byName[s.Name] = existing
		}
	}

	// --- staff ---
	staffSeed := []struct {
		Name     string
		Title    string
		Bio      string
		Services []string
	}{
		{"Amara Tesfaye", "Senior Hair Stylist", "10 years of cutting, colouring and styling experience.", []string{"Signature Haircut", "Blowout & Styling", "Hair Coloring", "Balayage", "Deep Hair Treatment"}},
		{"Sofia Bekele", "Nail Artist", "Specialist in gel nails, nail art and luxury pedicures.", []string{"Classic Manicure", "Luxury Pedicure", "Gel Nails", "Nail Art"}},
		{"Lily Haile", "Makeup Artist", "Bridal and occasion makeup with a soft, glowing finish.", []string{"Occasion Makeup", "Eyebrow Shaping", "Eyelash Extensions"}},
		{"Mia Girma", "Esthetician", "Skin care and facial specialist for all skin types.", []string{"Glow Facial", "Eyebrow Shaping", "Deep Hair Treatment"}},
	}
	staffByName := map[string]models.Staff{}
	for _, st := range staffSeed {
		var existing models.Staff
		if err := db.Where("name = ?", st.Name).First(&existing).Error; err != nil {
			s := models.Staff{Name: st.Name, Title: st.Title, Bio: st.Bio, IsActive: true}
			if err := db.Create(&s).Error; err != nil {
				return err
			}
			existing = s
		}
		staffByName[st.Name] = existing
		// link services
		for _, svcName := range st.Services {
			svc := byName[svcName]
			var link models.StaffService
			if err := db.Where("staff_id = ? AND service_id = ?", existing.ID, svc.ID).First(&link).Error; err != nil {
				_ = db.Create(&models.StaffService{StaffID: existing.ID, ServiceID: svc.ID}).Error
			}
		}
		// default schedule Mon-Sat 09:00-18:00, Sunday off
		for wd := 0; wd <= 6; wd++ {
			var sch models.StaffSchedule
			if err := db.Where("staff_id = ? AND weekday = ?", existing.ID, wd).First(&sch).Error; err != nil {
				off := wd == 0
				start, end := "09:00", "18:00"
				if off {
					start, end = "09:00", "18:00"
				}
				_ = db.Create(&models.StaffSchedule{StaffID: existing.ID, Weekday: wd, StartTime: start, EndTime: end, IsDayOff: off}).Error
			}
		}
	}

	// --- salon settings ---
	defaults := map[string]string{
		"salon_name":    cfg.SalonName,
		"open_time":     "09:00",
		"close_time":    "18:00",
		"currency":      "USD",
		"slot_interval": "30",
	}
	for k, v := range defaults {
		var s models.SalonSetting
		if err := db.Where("key = ?", k).First(&s).Error; err != nil {
			_ = db.Create(&models.SalonSetting{Key: k, Value: v}).Error
		}
	}

	// --- sample future appointments for the demo customer ---
	var count int64
	db.Model(&models.Appointment{}).Count(&count)
	if count == 0 {
		amara := staffByName["Amara Tesfaye"]
		sofia := staffByName["Sofia Bekele"]
		samples := []struct {
			Service string
			Staff   models.Staff
			DayOff  int
			Start   string
			Status  string
		}{
			{"Signature Haircut", amara, 1, "10:00", models.StatusConfirmed},
			{"Gel Nails", sofia, 2, "14:00", models.StatusPending},
			{"Glow Facial", staffByName["Mia Girma"], 4, "11:00", models.StatusConfirmed},
		}
		for _, sm := range samples {
			svc := byName[sm.Service]
			date := time.Now().AddDate(0, 0, sm.DayOff).Format("2006-01-02")
			startMin, _ := time.Parse("15:04", sm.Start)
			end := startMin.Add(time.Duration(svc.DurationMinutes) * time.Minute).Format("15:04")
			staffID := sm.Staff.ID
			_ = db.Create(&models.Appointment{
				CustomerID: customer.ID, ServiceID: svc.ID, StaffID: &staffID,
				Date: date, StartTime: sm.Start, EndTime: end,
				Status: sm.Status, PriceCents: svc.PriceCents, Notes: "Seeded demo appointment",
			}).Error
		}
	}
	return nil
}

func ensureUser(db *gorm.DB, email, name, phone, role, password string) (models.User, error) {
	var u models.User
	if err := db.Where("email = ?", email).First(&u).Error; err == nil {
		return u, nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return u, err
	}
	u = models.User{ID: uuid.New(), FullName: name, Email: email, Phone: phone, PasswordHash: string(hash), Role: role, IsActive: true}
	return u, db.Create(&u).Error
}
