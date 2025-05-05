using System;
using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects
{
    public class CreateCategoryDto
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; }


        public string IconName { get; set; }

        public int? ParentCategoryId { get; set; }
    }

    public class UpdateCategoryDto : CreateCategoryDto
    {
    }

    public class CategoryResponseDto : CreateCategoryDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<CategoryResponseDto> Categories { get; set; }
        public CategoryResponseDto ParentCategory { get; set; }
    }
}