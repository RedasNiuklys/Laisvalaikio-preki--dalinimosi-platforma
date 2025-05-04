using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EquipmentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Equipment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipmentResponseDto>>> GetEquipment()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var equipment = await _context.Equipment
                .Include(e => e.Location)
                .Include(e => e.Images)
                .Where(e => e.OwnerId == userId)
                .Select(e => new EquipmentResponseDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Description = e.Description,
                    Category = e.Category,
                    Condition = e.Condition,
                    OwnerId = e.OwnerId,
                    Status = e.IsAvailable ? "Available" : "Unavailable",
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
                    Location = new LocationResponseDto
                    {
                        Id = e.Location.Id,
                        Name = e.Location.Name,
                        Description = e.Location.Description,
                        StreetAddress = e.Location.StreetAddress,
                        City = e.Location.City,
                        State = e.Location.State,
                        PostalCode = e.Location.PostalCode,
                        Country = e.Location.Country,
                        Latitude = e.Location.Latitude,
                        Longitude = e.Location.Longitude,
                        UserId = e.Location.UserId,
                        CreatedAt = e.Location.CreatedAt,
                        UpdatedAt = e.Location.UpdatedAt
                    },
                    ImageUrls = e.Images.Select(i => i.ImageUrl).ToList()
                })
                .ToListAsync();

            return equipment;
        }

        // GET: api/Equipment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EquipmentResponseDto>> GetEquipment(string id)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Location)
                .Include(e => e.Images)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
            {
                return NotFound();
            }

            return new EquipmentResponseDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                Description = equipment.Description,
                Category = equipment.Category,
                Condition = equipment.Condition,
                OwnerId = equipment.OwnerId,
                Status = equipment.IsAvailable ? "Available" : "Unavailable",
                CreatedAt = equipment.CreatedAt,
                UpdatedAt = equipment.UpdatedAt,
                Location = new LocationResponseDto
                {
                    Id = equipment.Location.Id,
                    Name = equipment.Location.Name,
                    Description = equipment.Location.Description,
                    StreetAddress = equipment.Location.StreetAddress,
                    City = equipment.Location.City,
                    State = equipment.Location.State,
                    PostalCode = equipment.Location.PostalCode,
                    Country = equipment.Location.Country,
                    Latitude = equipment.Location.Latitude,
                    Longitude = equipment.Location.Longitude,
                    UserId = equipment.Location.UserId,
                    CreatedAt = equipment.Location.CreatedAt,
                    UpdatedAt = equipment.Location.UpdatedAt
                },
                ImageUrls = equipment.Images.Select(i => i.ImageUrl).ToList()
            };
        }

        // POST: api/Equipment
        [HttpPost]
        public async Task<ActionResult<EquipmentResponseDto>> CreateEquipment(CreateEquipmentDto createDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var equipment = new Equipment
            {
                Name = createDto.Name,
                Description = createDto.Description,
                Category = createDto.Category,
                Condition = createDto.Condition,
                OwnerId = userId,
                LocationId = createDto.LocationId,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Equipment.Add(equipment);
            await _context.SaveChangesAsync();

            // Add images if provided
            if (createDto.ImageUrls != null && createDto.ImageUrls.Any())
            {
                foreach (var imageUrl in createDto.ImageUrls)
                {
                    var image = new EquipmentImage
                    {
                        EquipmentId = equipment.Id,
                        ImageUrl = imageUrl,
                        IsMainImage = createDto.ImageUrls.IndexOf(imageUrl) == 0,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.EquipmentImages.Add(image);
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(
                nameof(GetEquipment),
                new { id = equipment.Id },
                new EquipmentResponseDto
                {
                    Id = equipment.Id,
                    Name = equipment.Name,
                    Description = equipment.Description,
                    Category = equipment.Category,
                    Condition = equipment.Condition,
                    OwnerId = equipment.OwnerId,
                    Status = "Available",
                    CreatedAt = equipment.CreatedAt,
                    UpdatedAt = equipment.UpdatedAt,
                    Location = new LocationResponseDto
                    {
                        Id = equipment.Location.Id,
                        Name = equipment.Location.Name,
                        Description = equipment.Location.Description,
                        StreetAddress = equipment.Location.StreetAddress,
                        City = equipment.Location.City,
                        State = equipment.Location.State,
                        PostalCode = equipment.Location.PostalCode,
                        Country = equipment.Location.Country,
                        Latitude = equipment.Location.Latitude,
                        Longitude = equipment.Location.Longitude,
                        UserId = equipment.Location.UserId,
                        CreatedAt = equipment.Location.CreatedAt,
                        UpdatedAt = equipment.Location.UpdatedAt
                    },
                    ImageUrls = equipment.Images.Select(i => i.ImageUrl).ToList()
                });
        }

        // PUT: api/Equipment/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEquipment(string id, UpdateEquipmentDto updateDto)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Images)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
            {
                return NotFound();
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (equipment.OwnerId != userId)
            {
                return Forbid();
            }

            equipment.Name = updateDto.Name ?? equipment.Name;
            equipment.Description = updateDto.Description ?? equipment.Description;
            equipment.Category = updateDto.Category ?? equipment.Category;
            equipment.Condition = updateDto.Condition ?? equipment.Condition;
            equipment.LocationId = updateDto.LocationId;
            equipment.IsAvailable = updateDto.Status == "Available";
            equipment.UpdatedAt = DateTime.UtcNow;

            // Update images if provided
            if (updateDto.ImageUrls != null)
            {
                // Remove existing images
                _context.EquipmentImages.RemoveRange(equipment.Images);

                // Add new images
                foreach (var imageUrl in updateDto.ImageUrls)
                {
                    var image = new EquipmentImage
                    {
                        EquipmentId = equipment.Id,
                        ImageUrl = imageUrl,
                        IsMainImage = updateDto.ImageUrls.IndexOf(imageUrl) == 0,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.EquipmentImages.Add(image);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EquipmentExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Equipment/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEquipment(string id)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Images)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
            {
                return NotFound();
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (equipment.OwnerId != userId)
            {
                return Forbid();
            }

            _context.EquipmentImages.RemoveRange(equipment.Images);
            _context.Equipment.Remove(equipment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Equipment/owner/{userId}
        [HttpGet("owner/{userId}")]
        public async Task<ActionResult<IEnumerable<EquipmentResponseDto>>> GetEquipmentByOwner(string userId)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Location)
                .Include(e => e.Images)
                .Where(e => e.OwnerId == userId)
                .Select(e => new EquipmentResponseDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    Description = e.Description,
                    Category = e.Category,
                    Condition = e.Condition,
                    OwnerId = e.OwnerId,
                    Status = e.IsAvailable ? "Available" : "Unavailable",
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
                    Location = new LocationResponseDto
                    {
                        Id = e.Location.Id,
                        Name = e.Location.Name,
                        Description = e.Location.Description,
                        StreetAddress = e.Location.StreetAddress,
                        City = e.Location.City,
                        State = e.Location.State,
                        PostalCode = e.Location.PostalCode,
                        Country = e.Location.Country,
                        Latitude = e.Location.Latitude,
                        Longitude = e.Location.Longitude,
                        UserId = e.Location.UserId,
                        CreatedAt = e.Location.CreatedAt,
                        UpdatedAt = e.Location.UpdatedAt
                    },
                    ImageUrls = e.Images.Select(i => i.ImageUrl).ToList()
                })
                .ToListAsync();

            return equipment;
        }

        private bool EquipmentExists(string id)
        {
            return _context.Equipment.Any(e => e.Id == id);
        }
    }
} 