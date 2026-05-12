using System;
using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class Review
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        public string EquipmentId { get; set; } = string.Empty;
        public Equipment Equipment { get; set; } = null!;

        [Required]
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        [Required]
        public string BookingId { get; set; } = string.Empty;
        public Booking Booking { get; set; } = null!;

        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(1000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
