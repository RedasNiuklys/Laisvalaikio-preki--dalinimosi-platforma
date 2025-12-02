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

    public class EquipmentResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public CategoryDto Category { get; set; } = new();
        public string Condition { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public LocationDto Location { get; set; } = new();
        public List<EquipmentImageDto> Images { get; set; } = new();
        public List<BookingDto> Bookings { get; set; } = new();
    }

    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? IconName { get; set; }
        public int? ParentCategoryId { get; set; }
    }

    public class LocationDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class EquipmentImageDto
    {
        public string Id { get; set; } = string.Empty;
        public string EquipmentId { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsMainImage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class BookingDto
    {
        public string Id { get; set; } = string.Empty;
        public string EquipmentId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}