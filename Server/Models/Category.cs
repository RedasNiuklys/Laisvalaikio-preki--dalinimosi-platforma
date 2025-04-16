using System;
using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        [StringLength(200)]
        public string Description { get; set; }

        public string IconName { get; set; }

        public int? ParentCategoryId { get; set; }
        public Category ParentCategory { get; set; }

        public ICollection<Category> Subcategories { get; set; }
        public ICollection<Equipment> Equipment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
} 