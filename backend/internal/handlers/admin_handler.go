package handlers

import (
	"net/http"
	"strconv"

	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/services"
	"blush-salon/backend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminHandler serves all /api/admin endpoints.
type AdminHandler struct {
	store *repositories.Store
	admin *services.AdminService
	appt  *services.AppointmentService
}

func NewAdminHandler(store *repositories.Store, admin *services.AdminService, appt *services.AppointmentService) *AdminHandler {
	return &AdminHandler{store: store, admin: admin, appt: appt}
}

func pageParams(c *gin.Context) (page, limit int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return page, limit
}

func (h *AdminHandler) Stats(c *gin.Context) {
	stats, err := h.admin.Stats()
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load statistics")
		return
	}
	utils.OK(c, "Statistics", stats)
}

// ListServicesAdmin lists all services including inactive ones.
func (h *AdminHandler) ListServicesAdmin(c *gin.Context) {
	services, err := h.store.ListServices("", false)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load services")
		return
	}
	if services == nil {
		services = []models.Service{}
	}
	utils.OK(c, "Services", services)
}

// ListStaffAdmin lists all staff including inactive ones.
func (h *AdminHandler) ListStaffAdmin(c *gin.Context) {
	staff, err := h.store.ListStaff(false)
	if err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load staff")
		return
	}
	if staff == nil {
		staff = []models.Staff{}
	}
	utils.OK(c, "Staff", staff)
}

// ListAppointments supports status/date/staff/service/search filters + pagination.
func (h *AdminHandler) ListAppointments(c *gin.Context) {
	page, limit := pageParams(c)
	q := h.store.DB.Preload("Customer").Preload("Service").Preload("Staff").Order("date DESC, start_time DESC")
	if v := c.Query("status"); v != "" {
		q = q.Where("status = ?", v)
	}
	if v := c.Query("date"); v != "" {
		q = q.Where("date = ?", v)
	}
	if v := c.Query("staff_id"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			q = q.Where("staff_id = ?", id)
		}
	}
	if v := c.Query("service_id"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			q = q.Where("service_id = ?", id)
		}
	}
	if v := c.Query("search"); v != "" {
		like := "%" + v + "%"
		q = q.Joins("LEFT JOIN users ON users.id = appointments.customer_id").
			Where("LOWER(users.full_name) LIKE LOWER(?) OR LOWER(users.email) LIKE LOWER(?) OR LOWER(appointments.notes) LIKE LOWER(?)", like, like, like)
	}
	var total int64
	if err := q.Model(&models.Appointment{}).Count(&total).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load appointments")
		return
	}
	var out []models.Appointment
	if err := q.Offset((page - 1) * limit).Limit(limit).Find(&out).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load appointments")
		return
	}
	if out == nil {
		out = []models.Appointment{}
	}
	utils.OK(c, "Appointments", utils.PagedData{Items: out, Total: total, Page: page, Limit: limit})
}

func (h *AdminHandler) SetAppointmentStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid appointment id")
		return
	}
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "status is required")
		return
	}
	appt, err := h.store.FindAppointment(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Appointment not found")
		return
	}
	if err := h.appt.SetStatus(appt, req.Status); err != nil {
		utils.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.OK(c, "Appointment status updated", appt)
}

// --- customers ---

func (h *AdminHandler) ListCustomers(c *gin.Context) {
	page, limit := pageParams(c)
	q := h.store.DB.Model(&models.User{}).Where("role = ?", models.RoleCustomer).Order("created_at DESC")
	if v := c.Query("search"); v != "" {
		like := "%" + v + "%"
		q = q.Where("LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?) OR LOWER(phone) LIKE LOWER(?)", like, like, like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load customers")
		return
	}
	var users []models.User
	if err := q.Offset((page - 1) * limit).Limit(limit).Find(&users).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load customers")
		return
	}
	public := make([]models.PublicUser, 0, len(users))
	for _, u := range users {
		public = append(public, u.Public())
	}
	utils.OK(c, "Customers", utils.PagedData{Items: public, Total: total, Page: page, Limit: limit})
}

func (h *AdminHandler) CustomerAppointments(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid customer id")
		return
	}
	var out []models.Appointment
	if err := h.store.DB.Preload("Service").Preload("Staff").Where("customer_id = ?", id).Order("date DESC, start_time DESC").Find(&out).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load appointments")
		return
	}
	if out == nil {
		out = []models.Appointment{}
	}
	utils.OK(c, "Customer appointments", out)
}

// --- services (admin CRUD) ---

type serviceRequest struct {
	Name            string  `json:"name" binding:"required"`
	Description     string  `json:"description"`
	Category        string  `json:"category" binding:"required"`
	Price           float64 `json:"price"`
	DurationMinutes int     `json:"duration_minutes" binding:"required"`
	Icon            string  `json:"icon"`
	IsActive        *bool   `json:"is_active"`
}

func (h *AdminHandler) CreateService(c *gin.Context) {
	var req serviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "name, category, price and duration are required")
		return
	}
	if req.Price < 0 || req.DurationMinutes <= 0 {
		utils.Fail(c, http.StatusBadRequest, "price and duration must be positive")
		return
	}
	svc := models.Service{Name: req.Name, Description: req.Description, Category: req.Category, Price: req.Price, DurationMinutes: req.DurationMinutes, Icon: req.Icon, IsActive: true}
	if req.IsActive != nil {
		svc.IsActive = *req.IsActive
	}
	if err := h.store.DB.Create(&svc).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not create service")
		return
	}
	utils.Created(c, "Service created successfully", svc)
}

func (h *AdminHandler) UpdateService(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid service id")
		return
	}
	svc, err := h.store.FindService(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Service not found")
		return
	}
	var req serviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid request")
		return
	}
	svc.Name, svc.Description, svc.Category, svc.DurationMinutes, svc.Icon = req.Name, req.Description, req.Category, req.DurationMinutes, req.Icon
	if req.Price != 0 {
		svc.Price = req.Price
	}
	if req.IsActive != nil {
		svc.IsActive = *req.IsActive
	}
	if err := h.store.DB.Save(svc).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not update service")
		return
	}
	utils.OK(c, "Service updated successfully", svc)
}

func (h *AdminHandler) DeleteService(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid service id")
		return
	}
	if err := h.store.DB.Delete(&models.Service{}, "id = ?", id).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not delete service")
		return
	}
	utils.OK(c, "Service deleted successfully", nil)
}

// --- staff (admin CRUD) ---

type staffRequest struct {
	Name      string `json:"name" binding:"required"`
	Title     string `json:"title"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
	IsActive  *bool  `json:"is_active"`
}

func (h *AdminHandler) CreateStaff(c *gin.Context) {
	var req staffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "name is required")
		return
	}
	st := models.Staff{Name: req.Name, Title: req.Title, Bio: req.Bio, AvatarURL: req.AvatarURL, IsActive: true}
	if req.IsActive != nil {
		st.IsActive = *req.IsActive
	}
	if err := h.store.DB.Create(&st).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not create staff member")
		return
	}
	// Default Mon-Sat schedule so the new member is bookable immediately.
	for wd := 0; wd <= 6; wd++ {
		_ = h.store.DB.Create(&models.StaffSchedule{StaffID: st.ID, Weekday: wd, StartTime: "09:00", EndTime: "18:00", IsDayOff: wd == 0}).Error
	}
	utils.Created(c, "Staff member created successfully", st)
}

func (h *AdminHandler) UpdateStaff(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid staff id")
		return
	}
	st, err := h.store.FindStaff(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Staff member not found")
		return
	}
	var req staffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid request")
		return
	}
	st.Name, st.Title, st.Bio, st.AvatarURL = req.Name, req.Title, req.Bio, req.AvatarURL
	if req.IsActive != nil {
		st.IsActive = *req.IsActive
	}
	if err := h.store.DB.Save(st).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not update staff member")
		return
	}
	utils.OK(c, "Staff member updated successfully", st)
}

func (h *AdminHandler) DeleteStaff(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid staff id")
		return
	}
	// Soft-delete: deactivate so past appointments keep their history.
	if err := h.store.DB.Model(&models.Staff{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not remove staff member")
		return
	}
	utils.OK(c, "Staff member deactivated successfully", nil)
}

func (h *AdminHandler) SetStaffServices(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid staff id")
		return
	}
	var req struct {
		ServiceIDs []uuid.UUID `json:"service_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "service_ids is required")
		return
	}
	st, err := h.store.FindStaff(id)
	if err != nil {
		utils.Fail(c, http.StatusNotFound, "Staff member not found")
		return
	}
	var svcs []models.Service
	if len(req.ServiceIDs) > 0 {
		if err := h.store.DB.Where("id IN ?", req.ServiceIDs).Find(&svcs).Error; err != nil {
			utils.Fail(c, http.StatusInternalServerError, "Could not load services")
			return
		}
	}
	if err := h.store.DB.Model(st).Association("Services").Replace(svcs); err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not update staff services")
		return
	}
	utils.OK(c, "Staff services updated", nil)
}

// --- staff schedule ---

func (h *AdminHandler) ListStaffSchedule(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid staff id")
		return
	}
	var out []models.StaffSchedule
	if err := h.store.DB.Where("staff_id = ?", id).Order("weekday").Find(&out).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load schedule")
		return
	}
	if out == nil {
		out = []models.StaffSchedule{}
	}
	utils.OK(c, "Schedule", out)
}

func (h *AdminHandler) UpdateStaffSchedule(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid staff id")
		return
	}
	var req []models.StaffSchedule
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "schedule entries are required")
		return
	}
	for _, entry := range req {
		if entry.Weekday < 0 || entry.Weekday > 6 {
			utils.Fail(c, http.StatusBadRequest, "weekday must be 0-6")
			return
		}
		var existing models.StaffSchedule
		err := h.store.DB.Where("staff_id = ? AND weekday = ?", id, entry.Weekday).First(&existing).Error
		if err != nil {
			entry.StaffID = id
			if err := h.store.DB.Create(&entry).Error; err != nil {
				utils.Fail(c, http.StatusInternalServerError, "Could not save schedule")
				return
			}
		} else {
			existing.StartTime, existing.EndTime, existing.IsDayOff = entry.StartTime, entry.EndTime, entry.IsDayOff
			_ = h.store.DB.Save(&existing).Error
		}
	}
	utils.OK(c, "Schedule updated", nil)
}

// --- blocked dates ---

func (h *AdminHandler) ListBlockedDates(c *gin.Context) {
	var out []models.BlockedDate
	if err := h.store.DB.Order("date").Find(&out).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load blocked dates")
		return
	}
	if out == nil {
		out = []models.BlockedDate{}
	}
	utils.OK(c, "Blocked dates", out)
}

func (h *AdminHandler) CreateBlockedDate(c *gin.Context) {
	var req models.BlockedDate
	if err := c.ShouldBindJSON(&req); err != nil || req.Date == "" {
		utils.Fail(c, http.StatusBadRequest, "date is required (YYYY-MM-DD)")
		return
	}
	if _, ok := utils.ParseDate(req.Date); !ok {
		utils.Fail(c, http.StatusBadRequest, "date must be YYYY-MM-DD")
		return
	}
	if err := h.store.DB.Create(&req).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not create blocked date")
		return
	}
	utils.Created(c, "Date blocked successfully", req)
}

func (h *AdminHandler) DeleteBlockedDate(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid id")
		return
	}
	if err := h.store.DB.Delete(&models.BlockedDate{}, "id = ?", id).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not delete blocked date")
		return
	}
	utils.OK(c, "Blocked date removed", nil)
}

// --- settings ---

func (h *AdminHandler) GetSettings(c *gin.Context) {
	var out []models.SalonSetting
	if err := h.store.DB.Find(&out).Error; err != nil {
		utils.Fail(c, http.StatusInternalServerError, "Could not load settings")
		return
	}
	m := map[string]string{}
	for _, s := range out {
		m[s.Key] = s.Value
	}
	utils.OK(c, "Settings", m)
}

func (h *AdminHandler) UpdateSettings(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.Fail(c, http.StatusBadRequest, "Invalid request")
		return
	}
	for k, v := range req {
		var s models.SalonSetting
		if err := h.store.DB.Where("key = ?", k).First(&s).Error; err != nil {
			_ = h.store.DB.Create(&models.SalonSetting{Key: k, Value: v}).Error
		} else {
			s.Value = v
			_ = h.store.DB.Save(&s).Error
		}
	}
	utils.OK(c, "Settings updated", req)
}
