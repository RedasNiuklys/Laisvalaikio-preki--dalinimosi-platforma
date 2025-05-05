using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class EquipmentImage
    {
        [Key]
        public string Id { get; set; }

        [Required]
        public string EquipmentId { get; set; }
        public Equipment Equipment { get; set; }

        [Required]
        public string ImageUrl { get; set; }

        public bool IsMainImage { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}