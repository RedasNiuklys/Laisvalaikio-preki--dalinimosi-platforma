using System;
using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects
{
    public class CreateLocationDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        [StringLength(100)]
        public string StreetAddress { get; set; }

        [Required]
        [StringLength(100)]
        public string City { get; set; }

        [Required]
        [StringLength(50)]
        public string State { get; set; }

        [Required]
        [StringLength(20)]
        public string PostalCode { get; set; }

        [Required]
        [StringLength(100)]
        public string Country { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    public class UpdateLocationDto : CreateLocationDto
    {
    }

    public class LocationResponseDto : CreateLocationDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 