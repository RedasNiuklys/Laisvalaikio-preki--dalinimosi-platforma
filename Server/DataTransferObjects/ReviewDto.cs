using System;
using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects
{
    public class CreateReviewDto
    {
        [Required]
        public required string EquipmentId { get; set; }

        [Required]
        public required string BookingId { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(1000)]
        public string? Comment { get; set; }
    }

    public class UpdateReviewDto
    {
        [Range(1, 5)]
        public int? Rating { get; set; }

        [StringLength(1000)]
        public string? Comment { get; set; }
    }

    public class ReviewEligibilityDto
    {
        public bool CanReview { get; set; }
        public string? EligibleBookingId { get; set; }
        public string? Reason { get; set; }
    }

    public class ReviewResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string EquipmentId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string BookingId { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public UserResponseDto Reviewer { get; set; } = new();
    }
}
