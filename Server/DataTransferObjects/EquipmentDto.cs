using System;
using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects
{
    public class CreateEquipmentDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        [StringLength(50)]
        public string Category { get; set; }

        [Required]
        public string Condition { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal DailyRate { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal WeeklyRate { get; set; }

        public List<string> ImageUrls { get; set; }

        [Required]
        public int LocationId { get; set; }
    }

    public class UpdateEquipmentDto : CreateEquipmentDto
    {
        public string Status { get; set; }
    }

    public class EquipmentResponseDto : CreateEquipmentDto
    {
        public int Id { get; set; }
        public string OwnerId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Include location details
        public LocationResponseDto Location { get; set; }
    }
} 