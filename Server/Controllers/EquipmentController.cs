using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Cors;
using AutoMapper;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;

        public EquipmentController(
            ApplicationDbContext context,
            IConfiguration configuration,
            IMapper mapper)
        {
            _context = context;
            _configuration = configuration;
            _mapper = mapper;
        }

        private string GetFullImageUrl(string imageUrl, string equipmentId)
        {
            if (string.IsNullOrEmpty(imageUrl)) return null;

            var normalizedUrl = imageUrl.Replace("\\", "/");

            // Extract filename from the path (e.g., "uploads/equipment/filename.jpg" -> "filename.jpg")
            var fileName = Path.GetFileName(normalizedUrl);

            var currentBaseUrl = $"{Request.Scheme}://{Request.Host}";
            // Return API endpoint URL instead of direct file path
            return $"{currentBaseUrl}/api/Storage/GetEquipmentImage/{equipmentId}/{fileName}";
        }

        private static string GetRelativeImageUrl(string fullUrl)
        {
            if (string.IsNullOrEmpty(fullUrl)) return null;

            var normalizedUrl = fullUrl.Replace("\\", "/");
            if (Uri.TryCreate(normalizedUrl, UriKind.Absolute, out var absoluteUri))
            {
                return absoluteUri.AbsolutePath.TrimStart('/');
            }

            return normalizedUrl.TrimStart('/');
        }

        // GET: api/Equipment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipmentResponseDto>>> GetEquipment()
        {
            try
            {
                System.Console.WriteLine("GetEquipment method called");
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                System.Console.WriteLine($"User ID from token: {userId}");

                if (string.IsNullOrEmpty(userId))
                {
                    System.Console.WriteLine("User ID is null or empty, returning Unauthorized");
                    return Unauthorized();
                }

                System.Console.WriteLine("Fetching equipment from database");
                var equipment = await _context.Equipment
                    .Include(e => e.Location)
                    .Include(e => e.Images)
                    .Include(e => e.Category)
                    .ToListAsync();

                var dtos = _mapper.Map<List<EquipmentResponseDto>>(equipment);

                // Transform image URLs to full URLs
                foreach (var dto in dtos)
                {
                    if (dto.Images != null)
                    {
                        foreach (var image in dto.Images)
                        {
                            image.ImageUrl = GetFullImageUrl(image.ImageUrl, image.EquipmentId);
                        }
                    }
                }

                System.Console.WriteLine($"Found {dtos.Count} equipment items");
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"Error in GetEquipment: {ex.Message}");
                System.Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, "An error occurred while retrieving equipment");
            }
        }

        // GET: api/Equipment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EquipmentResponseDto>> GetEquipment(string id)
        {
            var equipment = await _context.Equipment
                .Include(e => e.Location)
                .Include(e => e.Images)
                .Include(e => e.Category)
                .Include(e => e.Bookings)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
            {
                return NotFound();
            }

            var dto = _mapper.Map<EquipmentResponseDto>(equipment);

            // Transform image URLs to full URLs
            if (dto.Images != null)
            {
                foreach (var image in dto.Images)
                {
                    image.ImageUrl = GetFullImageUrl(image.ImageUrl, image.EquipmentId);
                    System.Console.WriteLine($"Transformed image URL: {image.ImageUrl}");
                }
            }

            return dto;
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
                var filePath = Path.Combine("wwwroot", "uploads", "equipment", id, fileName);

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
                    ImageUrl = Path.Combine("uploads", "equipment", id, fileName),
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

        // DELETE: api/Equipment/{id}/images/{imageId}
        [HttpDelete("{id}/images/{imageId}")]
        public async Task<IActionResult> DeleteEquipmentImage([FromRoute] string id, [FromRoute] string imageId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var equipment = await _context.Equipment.FirstOrDefaultAsync(e => e.Id == id);
            if (equipment == null)
            {
                return NotFound("Equipment not found");
            }

            if (equipment.OwnerId != userId)
            {
                return Forbid();
            }

            var image = await _context.EquipmentImages
                .FirstOrDefaultAsync(i => i.Id == imageId && i.EquipmentId == id);

            if (image == null)
            {
                // Idempotent delete for retries/race conditions.
                return NoContent();
            }

            try
            {
                var relativePath = GetRelativeImageUrl(image.ImageUrl);
                if (!string.IsNullOrWhiteSpace(relativePath))
                {
                    var normalizedPath = relativePath.Replace("/", Path.DirectorySeparatorChar.ToString());
                    var physicalPath = Path.Combine("wwwroot", normalizedPath);

                    if (System.IO.File.Exists(physicalPath))
                    {
                        System.IO.File.Delete(physicalPath);
                    }
                }

                _context.EquipmentImages.Remove(image);
                await _context.SaveChangesAsync();

                return NoContent();
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

            var equipment = _mapper.Map<Equipment>(createDto);
            equipment.Id = Guid.NewGuid().ToString();
            equipment.OwnerId = userId;
            equipment.IsAvailable = true;
            equipment.CreatedAt = DateTime.UtcNow;
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
                        Id = Guid.NewGuid().ToString(),
                        EquipmentId = equipment.Id,
                        ImageUrl = GetRelativeImageUrl(image.ImageUrl),
                        IsMainImage = image.IsMainImage,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.EquipmentImages.Add(equipmentImage);
                }
                // Save images to database
                await _context.SaveChangesAsync();
            }

            // Reload equipment with related data for response
            await _context.Entry(equipment).Reference(e => e.Location).LoadAsync();
            await _context.Entry(equipment).Reference(e => e.Category).LoadAsync();
            await _context.Entry(equipment).Collection(e => e.Images).LoadAsync();

            var responseDto = _mapper.Map<EquipmentResponseDto>(equipment);

            // Transform image URLs to full URLs
            if (responseDto.Images != null)
            {
                foreach (var image in responseDto.Images)
                {
                    image.ImageUrl = GetFullImageUrl(image.ImageUrl, image.EquipmentId);
                }
            }

            return CreatedAtAction(
                nameof(GetEquipment),
                new { id = equipment.Id },
                responseDto);
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
            if (updateDto.CategoryId != 0)
            {
                equipment.CategoryId = updateDto.CategoryId;
            }
            equipment.Category = updateDto.Category ?? equipment.Category;
            equipment.Condition = updateDto.Condition ?? equipment.Condition;
            equipment.LocationId = updateDto.LocationId;
            equipment.IsAvailable = updateDto.Status == "Available";
            equipment.UpdatedAt = DateTime.UtcNow;

            // Images are managed via dedicated endpoints:
            // POST /api/Equipment/{id}/images and DELETE /api/Equipment/{id}/images/{imageId}
            // Keep update endpoint metadata-only.

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
                .Include(e => e.Bookings)
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
            _context.Bookings.RemoveRange(equipment.Bookings);
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
                .Include(e => e.Category)
                .Where(e => e.OwnerId == userId)
                .ToListAsync();

            var dtos = _mapper.Map<List<EquipmentResponseDto>>(equipment);

            // Transform image URLs to full URLs
            foreach (var dto in dtos)
            {
                if (dto.Images != null)
                {
                    foreach (var image in dto.Images)
                    {
                        image.ImageUrl = GetFullImageUrl(image.ImageUrl, image.EquipmentId);
                    }
                }
            }

            return dtos;
        }

        private bool EquipmentExists(string id)
        {
            return _context.Equipment.Any(e => e.Id == id);
        }
    }
}