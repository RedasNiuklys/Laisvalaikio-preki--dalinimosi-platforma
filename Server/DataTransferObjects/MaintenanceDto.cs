using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects
{
    public class CreateMaintenanceRecordDto
    {
        [Required]
        public required string EquipmentId { get; set; }

        [Required]
        [StringLength(200)]
        public required string Title { get; set; }

        [Required]
        [StringLength(1000)]
        public required string Description { get; set; }

        [Required]
        public DateTime MaintenanceDate { get; set; }

        [Required]
        [StringLength(200)]
        public required string PerformedBy { get; set; }

        [StringLength(2000)]
        public string? Notes { get; set; }

        public bool SetUnavailable { get; set; }
    }

    public class UpdateMaintenanceRecordDto
    {
        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        public DateTime? MaintenanceDate { get; set; }

        [StringLength(200)]
        public string? PerformedBy { get; set; }

        [StringLength(2000)]
        public string? Notes { get; set; }
    }

    public class MaintenanceRecordResponseDto
    {
        public int Id { get; set; }
        public string EquipmentId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime MaintenanceDate { get; set; }
        public string PerformedBy { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
