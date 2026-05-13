using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class Booking
    {
        [Key]
        public string Id { get; set; } = null!;

        [Required]
        public string EquipmentId { get; set; } = null!;
        public Equipment Equipment { get; set; } = null!;

        [Required]
        public string UserId { get; set; } = null!;
        public ApplicationUser User { get; set; } = null!;

        [Required]
        public DateTime StartDateTime { get; set; }

        [Required]
        public DateTime EndDateTime { get; set; }

        [Required]
        public BookingStatus Status { get; set; } = BookingStatus.Pending;

        public string? Notes { get; set; }
        public BookingReturnRequestType? ReturnRequestType { get; set; }
        public DateTime? ReturnRequestedEndDateTime { get; set; }
        public string? ReturnPhotoUrl { get; set; }
        public DateTime? PickedAt { get; set; }
        public DateTime? ReturnedAt { get; set; }

        public Review? Review { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public enum BookingStatus
    {
        Pending = 0,
        Planning = 1,
        Approved = 2,
        Rejected = 3,
        Cancelled = 4,
        Picked = 5,
        ReturnRequested = 6,
        ReturnEarlyRequested = 7,
        Returned = 8,
        ReturnedEarly = 9
    }

    public enum BookingReturnRequestType
    {
        Regular = 0,
        Early = 1
    }
}