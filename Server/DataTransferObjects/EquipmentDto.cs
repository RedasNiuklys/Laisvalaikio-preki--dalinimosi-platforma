using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Server.Models;

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
        public int CategoryId { get; set; }
        public Category Category { get; set; }

        [Required]
        public string Condition { get; set; }

        [Required]
        public bool IsAvailable { get; set; }


        [Required]
        public string LocationId { get; set; }
        public List<EquipmentImage> Images { get; set; } = new List<EquipmentImage>();
    }

    public class UpdateEquipmentDto : CreateEquipmentDto
    {
        public string Status { get; set; }
    }

    public class EquipmentResponseDto : CreateEquipmentDto
    {
        public string Id { get; set; }
        public string OwnerId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Include location details
        public Location Location { get; set; }
    }
}