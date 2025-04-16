using System;
using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class UsedDates
    {
        public int Id { get; set; }

        [Required]
        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; }

        [Required]
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
} 