using System;
using System.ComponentModel.DataAnnotations;
using Server.Models;

namespace Server.DataTransferObjects
{
    public class CreateBookingDto
    {
        [Required]
        public required string EquipmentId { get; set; }

        [Required]
        public DateTime StartDateTime { get; set; }

        [Required]
        public DateTime EndDateTime { get; set; }

        public string? Notes { get; set; }
    }

    public class UpdateBookingDto
    {
        public DateTime? StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public BookingStatus? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateBookingStatusDto
    {
        [Required]
        public BookingStatus Status { get; set; }
    }

    public class BookingResponseDto
    {
        public required string Id { get; set; }
        public required string EquipmentId { get; set; }
        public required string UserId { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public BookingStatus Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Include related data
        public required EquipmentResponseDto Equipment { get; set; }
        public required UserResponseDto User { get; set; }
    }
}