// Command server is the Blush Beauty Salon API entrypoint.
package main

import (
	"log"
	"net/http"

	"blush-salon/backend/internal/config"
	"blush-salon/backend/internal/database"
	"blush-salon/backend/internal/handlers"
	"blush-salon/backend/internal/middleware"
	"blush-salon/backend/internal/models"
	"blush-salon/backend/internal/repositories"
	"blush-salon/backend/internal/services"
	"blush-salon/backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	store := repositories.New(db)
	authSvc := services.NewAuthService(store)
	availSvc := services.NewAvailabilityService(store)
	apptSvc := services.NewAppointmentService(store, availSvc)
	adminSvc := services.NewAdminService(store)

	authH := handlers.NewAuthHandler(authSvc, store, cfg.JWTSecret)
	publicH := handlers.NewPublicHandler(store)
	apptH := handlers.NewAppointmentHandler(store, apptSvc, availSvc)
	availH := handlers.NewAvailabilityHandler(store, availSvc)
	adminH := handlers.NewAdminHandler(store, adminSvc, apptSvc)

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery(), middleware.Logger(), middleware.CORS(cfg.CORSOrigins))

	r.GET("/health", func(c *gin.Context) {
		utils.OK(c, "Blush Beauty Salon API is running", gin.H{"salon": cfg.SalonName})
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
			auth.GET("/me", middleware.Auth(cfg.JWTSecret), authH.Me)
			auth.PUT("/me", middleware.Auth(cfg.JWTSecret), authH.UpdateProfile)
		}
		api.GET("/services", publicH.ListServices)
		api.GET("/services/:id", publicH.GetService)
		api.GET("/staff", publicH.ListStaff)
		api.GET("/staff/:id", publicH.GetStaff)
		api.GET("/availability/slots", availH.Slots)

		authed := api.Group("", middleware.Auth(cfg.JWTSecret))
		{
			authed.POST("/appointments", apptH.Create)
			authed.GET("/appointments/me", apptH.MyAppointments)
			authed.GET("/appointments/:id", apptH.Get)
			authed.PATCH("/appointments/:id/cancel", apptH.Cancel)
			authed.PATCH("/appointments/:id/reschedule", apptH.Reschedule)
		}

		admin := api.Group("/admin", middleware.Auth(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin))
		{
			admin.GET("/stats", adminH.Stats)
			admin.GET("/appointments", adminH.ListAppointments)
			admin.PATCH("/appointments/:id/status", adminH.SetAppointmentStatus)
			admin.GET("/customers", adminH.ListCustomers)
			admin.GET("/customers/:id/appointments", adminH.CustomerAppointments)
			admin.GET("/services", adminH.ListServicesAdmin)
			admin.POST("/services", adminH.CreateService)
			admin.PUT("/services/:id", adminH.UpdateService)
			admin.PATCH("/services/:id", adminH.UpdateService)
			admin.DELETE("/services/:id", adminH.DeleteService)
			admin.GET("/staff", adminH.ListStaffAdmin)
			admin.POST("/staff", adminH.CreateStaff)
			admin.PUT("/staff/:id", adminH.UpdateStaff)
			admin.PATCH("/staff/:id", adminH.UpdateStaff)
			admin.DELETE("/staff/:id", adminH.DeleteStaff)
			admin.POST("/staff/:id/services", adminH.SetStaffServices)
			admin.GET("/staff/:id/schedule", adminH.ListStaffSchedule)
			admin.PUT("/staff/:id/schedule", adminH.UpdateStaffSchedule)
			admin.GET("/blocked-dates", adminH.ListBlockedDates)
			admin.POST("/blocked-dates", adminH.CreateBlockedDate)
			admin.DELETE("/blocked-dates/:id", adminH.DeleteBlockedDate)
			admin.GET("/settings", adminH.GetSettings)
			admin.PUT("/settings", adminH.UpdateSettings)
		}
	}

	log.Printf("Blush Beauty Salon API listening on :%s (db: %s)", cfg.Port, dbName(cfg))
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func dbName(cfg *config.Config) string {
	if cfg.IsSQLite() {
		return "sqlite:" + cfg.SQLitePath()
	}
	return "postgres"
}
