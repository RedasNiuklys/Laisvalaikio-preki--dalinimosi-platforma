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
        private readonly IConfiguration _configuration;

        public EquipmentController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        private static string GetFullImageUrl(string relativeUrl, IConfiguration configuration)
        {
            if (string.IsNullOrEmpty(relativeUrl)) return null;
            if (relativeUrl.StartsWith("http")) return relativeUrl; // Already a full URL

            var localIP = configuration["AppSettings:LocalIP"];
            var apiPort = configuration["AppSettings:ApiPort"];
            Console.WriteLine(relativeUrl);
            relativeUrl = relativeUrl.Replace("\\", "/");
            return $"http://{localIP}:{apiPort}/{relativeUrl}";
        }

        private static string GetRelativeImageUrl(string fullUrl, IConfiguration configuration)
        {
            if (string.IsNullOrEmpty(fullUrl)) return null;

            var localIP = configuration["AppSettings:LocalIP"];
            var apiPort = configuration["AppSettings:ApiPort"];
            var baseUrl = $"http://{localIP}:{apiPort}/";
            Console.WriteLine(fullUrl);
            Console.WriteLine(baseUrl);
            fullUrl = fullUrl.Replace("\\", "/");
            return fullUrl.StartsWith(baseUrl)
                ? fullUrl.Substring(baseUrl.Length)
                : fullUrl;
        }

        // GET: api/Equipment
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipmentResponseDto>>> GetEquipment()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            var allEquipment = await _context.Equipment.ToListAsync();
            System.Console.WriteLine("allEquipment", allEquipment);

            var equipment = await _context.Equipment
                .Include(e => e.Location)
                .Include(e => e.Images)
                // .Where(e => e.OwnerId == userId)
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
                    Location = new Location
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
                    Images = e.Images.Select(i => new EquipmentImage
                    {
                        Id = i.Id,
                        EquipmentId = i.EquipmentId,
                        ImageUrl = GetFullImageUrl(i.ImageUrl, _configuration),
                        IsMainImage = i.IsMainImage,
                        CreatedAt = i.CreatedAt,
                        UpdatedAt = i.UpdatedAt
                    }).ToList()
                })
                .ToListAsync();
            System.Console.WriteLine("equipment", equipment);
            return Ok(equipment);
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
                Location = new Location
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
                Images = equipment.Images.Select(i => new EquipmentImage
                {
                    Id = i.Id,
                    EquipmentId = i.EquipmentId,
                    ImageUrl = GetFullImageUrl(i.ImageUrl, _configuration),
                    IsMainImage = i.IsMainImage,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                }).ToList()
            };
        }
        // POST: api/Equipment/{id}/images
        [HttpPost("{id}/images")]
        public async Task<ActionResult> AddEquipmentImage([FromRoute] string id, [FromForm] IFormFile file, [FromForm] bool isMainImage = false)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // var equipment = await _context.Equipment.FindAsync(id);
            // if (equipment == null)
            // {
            //     return NotFound();
            // }

            // if (equipment.OwnerId != userId)
            // {
            //     return Forbid();
            // }

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            try
            {
                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine("wwwroot", "uploads", "equipment", fileName);

                // Ensure directory exists
                Directory.CreateDirectory(Path.GetDirectoryName(filePath));

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Create equipment image record
                var equipmentImage = new EquipmentImage
                {
                    Id = Guid.NewGuid().ToString(),
                    EquipmentId = id,
                    ImageUrl = Path.Combine("uploads", "equipment", fileName),
                    IsMainImage = isMainImage,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.EquipmentImages.Add(equipmentImage);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: api/Equipment
        [HttpPost]
        public async Task<ActionResult<EquipmentResponseDto>> CreateEquipment(CreateEquipmentDto createDto)
        {
            Console.WriteLine("Creating equipment");
            Console.WriteLine(createDto.Name);
            Console.WriteLine(createDto.Description);
            Console.WriteLine(createDto.Category);
            Console.WriteLine(createDto.IsAvailable);
            Console.WriteLine(createDto.Condition);
            Console.WriteLine(createDto.LocationId);
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var equipment = new Equipment
            {
                Id = Guid.NewGuid().ToString(),
                Name = createDto.Name,
                Description = createDto.Description,
                Category = createDto.Category,
                Condition = createDto.Condition,
                OwnerId = userId,
                LocationId = createDto.LocationId,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };
            Console.WriteLine("Equipment created");

            _context.Equipment.Add(equipment);
            await _context.SaveChangesAsync();
            Console.WriteLine("Equipment saved");

            // Add images if provided
            if (createDto.Images != null && createDto.Images.Any())
            {
                foreach (var image in createDto.Images)
                {
                    var equipmentImage = new EquipmentImage
                    {
                        EquipmentId = equipment.Id,
                        ImageUrl = GetRelativeImageUrl(image.ImageUrl, _configuration),
                        IsMainImage = image.IsMainImage,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.EquipmentImages.Add(equipmentImage);
                }
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
                    LocationId = equipment.LocationId,
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
            if (updateDto.Images != null)
            {
                // Remove existing images
                _context.EquipmentImages.RemoveRange(equipment.Images);

                // Add new images
                foreach (var image in updateDto.Images)
                {
                    var equipmentImage = new EquipmentImage
                    {
                        EquipmentId = equipment.Id,
                        ImageUrl = GetRelativeImageUrl(image.ImageUrl, _configuration),
                        IsMainImage = image.IsMainImage,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.EquipmentImages.Add(equipmentImage);
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
                    Location = new Location
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
                    Images = e.Images.Select(i => new EquipmentImage
                    {
                        Id = i.Id,
                        EquipmentId = i.EquipmentId,
                        ImageUrl = GetFullImageUrl(i.ImageUrl, _configuration),
                        IsMainImage = i.IsMainImage,
                        CreatedAt = i.CreatedAt,
                        UpdatedAt = i.UpdatedAt
                    }).ToList()
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