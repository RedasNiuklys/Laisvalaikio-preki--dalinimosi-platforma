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
                            image.ImageUrl = GetFullImageUrl(image.ImageUrl, _configuration);
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
                    image.ImageUrl = GetFullImageUrl(image.ImageUrl, _configuration);
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
                        EquipmentId = equipment.Id,
                        ImageUrl = GetRelativeImageUrl(image.ImageUrl, _configuration),
                        IsMainImage = image.IsMainImage,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.EquipmentImages.Add(equipmentImage);
                }
            }
            // Reload equipment with related data for response
            await _context.Entry(equipment).Reference(e => e.Location).LoadAsync();
            await _context.Entry(equipment).Reference(e => e.Category).LoadAsync();

            var responseDto = _mapper.Map<EquipmentResponseDto>(equipment);

            // Transform image URLs to full URLs
            if (responseDto.Images != null)
            {
                foreach (var image in responseDto.Images)
                {
                    image.ImageUrl = GetFullImageUrl(image.ImageUrl, _configuration);
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
                        image.ImageUrl = GetFullImageUrl(image.ImageUrl, _configuration);
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