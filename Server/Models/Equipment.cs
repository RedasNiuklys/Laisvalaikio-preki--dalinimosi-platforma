using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class Equipment
    {
        [Key]
        public string Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        public string OwnerId { get; set; }
        public ApplicationUser Owner { get; set; }

        public Category Category { get; set; }
        [Required]
        public int CategoryId { get; set; }

        public List<string> Tags { get; set; } = new List<string>();

        [Required]
        public string Condition { get; set; } = "Good";

        public bool IsAvailable { get; set; } = true;

        [Required]
        public string LocationId { get; set; }
        public Location Location { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public List<Booking> Bookings { get; set; } = new List<Booking>();
        public List<MaintenanceRecord> MaintenanceHistory { get; set; } = new List<MaintenanceRecord>();
        public List<EquipmentImage> Images { get; set; } = new List<EquipmentImage>();
    }
}