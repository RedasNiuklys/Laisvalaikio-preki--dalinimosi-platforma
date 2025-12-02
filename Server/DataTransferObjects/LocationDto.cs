using System;
using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects
{
    public class CreateLocationDto
    {
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(100)]
        public required string StreetAddress { get; set; }

        [Required]
        [StringLength(100)]
        public required string City { get; set; }

        [StringLength(50)]
        public string? State { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [Required]
        [StringLength(100)]
        public required string Country { get; set; }

        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90 degrees")]
        public double? Latitude { get; set; }

        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180 degrees")]
        public double? Longitude { get; set; }
    }

    public class UpdateLocationDto : CreateLocationDto
    {
    }

    public class LocationResponseDto : CreateLocationDto
    {
        public required string Id { get; set; }
        public required string UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}