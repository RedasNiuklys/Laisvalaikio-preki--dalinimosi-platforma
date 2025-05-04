using System;

namespace Server.DataTransferObjects
{
    public class CreateEquipmentImageDto
    {
        public string ImageUrl { get; set; }
        public bool IsMainImage { get; set; }
    }

    public class EquipmentImageResponseDto : CreateEquipmentImageDto
    {
        public string Id { get; set; }
        public string EquipmentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 