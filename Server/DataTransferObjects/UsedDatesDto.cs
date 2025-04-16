using System;
using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects
{
    public class CreateUsedDatesDto
    {
        [Required]
        public int EquipmentId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }

    public class UpdateUsedDatesDto
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }

    public class UsedDatesResponseDto : CreateUsedDatesDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Include equipment details
        public EquipmentResponseDto Equipment { get; set; }
    }
} 