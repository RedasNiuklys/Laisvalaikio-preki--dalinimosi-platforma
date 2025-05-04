using System;
using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class MaintenanceRecord
    {
        public int Id { get; set; }

        [Required]
        public string EquipmentId { get; set; }
        public Equipment Equipment { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public DateTime MaintenanceDate { get; set; }

        [Required]
        public string PerformedBy { get; set; }

        public string Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
} 