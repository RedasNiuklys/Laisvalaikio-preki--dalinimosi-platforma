using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;
using Server.Models;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Category
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetCategories()
        {
            var categories = await _context.Categories
                .Include(c => c.Subcategories)
                .Where(c => c.ParentCategoryId == null)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    IconName = c.IconName,
                    ParentCategoryId = c.ParentCategoryId,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    Subcategories = c.Subcategories.Select(sc => new CategoryResponseDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        Description = sc.Description,
                        IconName = sc.IconName,
                        ParentCategoryId = sc.ParentCategoryId,
                        CreatedAt = sc.CreatedAt,
                        UpdatedAt = sc.UpdatedAt
                    }).ToList()
                })
                .ToListAsync();

            return categories;
        }

        // GET: api/Category/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryResponseDto>> GetCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Subcategories)
                .Include(c => c.ParentCategory)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound();
            }

            return new CategoryResponseDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                IconName = category.IconName,
                ParentCategoryId = category.ParentCategoryId,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt,
                ParentCategory = category.ParentCategory != null ? new CategoryResponseDto
                {
                    Id = category.ParentCategory.Id,
                    Name = category.ParentCategory.Name,
                    Description = category.ParentCategory.Description,
                    IconName = category.ParentCategory.IconName,
                    CreatedAt = category.ParentCategory.CreatedAt,
                    UpdatedAt = category.ParentCategory.UpdatedAt
                } : null,
                Subcategories = category.Subcategories.Select(sc => new CategoryResponseDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Description = sc.Description,
                    IconName = sc.IconName,
                    ParentCategoryId = sc.ParentCategoryId,
                    CreatedAt = sc.CreatedAt,
                    UpdatedAt = sc.UpdatedAt
                }).ToList()
            };
        }

        // POST: api/Category
        [HttpPost]
        public async Task<ActionResult<CategoryResponseDto>> CreateCategory(CreateCategoryDto createCategoryDto)
        {
            var category = new Category
            {
                Name = createCategoryDto.Name,
                Description = createCategoryDto.Description,
                IconName = createCategoryDto.IconName,
                ParentCategoryId = createCategoryDto.ParentCategoryId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetCategory),
                new { id = category.Id },
                new CategoryResponseDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    IconName = category.IconName,
                    ParentCategoryId = category.ParentCategoryId,
                    CreatedAt = category.CreatedAt,
                    UpdatedAt = category.UpdatedAt
                });
        }

        // PUT: api/Category/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto updateCategoryDto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            category.Name = updateCategoryDto.Name;
            category.Description = updateCategoryDto.Description;
            category.IconName = updateCategoryDto.IconName;
            category.ParentCategoryId = updateCategoryDto.ParentCategoryId;
            category.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoryExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Category/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Subcategories)
                .Include(c => c.Equipment)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound();
            }

            if (category.Subcategories.Any() || category.Equipment.Any())
            {
                return BadRequest("Cannot delete category with subcategories or equipment");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Category/5/subcategories
        [HttpGet("{id}/subcategories")]
        public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetSubcategories(int id)
        {
            var subcategories = await _context.Categories
                .Where(c => c.ParentCategoryId == id)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    IconName = c.IconName,
                    ParentCategoryId = c.ParentCategoryId,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return subcategories;
        }

        private bool CategoryExists(int id)
        {
            return _context.Categories.Any(e => e.Id == id);
        }
    }
} 