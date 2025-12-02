using System;
using System.ComponentModel.DataAnnotations;
using Server.Models;

namespace Server.DataTransferObjects
{
    public class CreateBookingDto
    {
        [Required]
        public string EquipmentId { get; set; }

        [Required]
        public DateTime StartDateTime { get; set; }

        [Required]
        public DateTime EndDateTime { get; set; }

        [Required]

        public string? Notes { get; set; }
    }

    public class UpdateBookingDto
    {
        public DateTime? StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public BookingStatus? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class BookingResponseDto
    {
        public string Id { get; set; }
        public string EquipmentId { get; set; }
        public string UserId { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public BookingStatus Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Include related data
        public EquipmentResponseDto Equipment { get; set; }
        public UserResponseDto User { get; set; }
    }
}