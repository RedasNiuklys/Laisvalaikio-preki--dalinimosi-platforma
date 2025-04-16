using System;
using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class Equipment
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        public int CategoryId { get; set; }
        public Category Category { get; set; }

        [Required]
        public string Condition { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();

        [Required]
        public string OwnerId { get; set; }
        public ApplicationUser Owner { get; set; }

        [Required]
        public int LocationId { get; set; }
        public Location Location { get; set; }

        [Required]
        public string Status { get; set; } = "Available";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation property for UsedDates
        public ICollection<UsedDates> UsedDates { get; set; }
    }
} 