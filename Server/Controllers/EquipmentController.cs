using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Cors;
using AutoMapper;
using Server.Services.Storage;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentController : ControllerBase
    {
        public class AddEquipmentImageForm
        {
            public IFormFile File { get; set; }
            public bool IsMainImage { get; set; }
        }

        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IObjectStorageService _objectStorage;

        public EquipmentController(
            ApplicationDbContext context,
            IMapper mapper,
            IObjectStorageService objectStorage)
        {
            _context = context;
            _mapper = mapper;
            _objectStorage = objectStorage;
        }

        private static double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0;
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
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

            return StorageKeyHelper.StripLegacyUploadsPrefix(normalizedUrl.TrimStart('/'));
        }

        // GET: api/Equipment?search=drill&categoryId=3&isAvailable=true&startDate=2026-06-01&endDate=2026-06-07&latitude=54.68&longitude=25.27&radiusKm=10
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipmentResponseDto>>> GetEquipment(
            [FromQuery] string? search = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] bool? isAvailable = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] double? latitude = null,
            [FromQuery] double? longitude = null,
            [FromQuery] double? radiusKm = null)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var query = _context.Equipment
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(e => e.Location)
                    .Include(e => e.Images)
                    .Include(e => e.Category)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var term = search.Trim().ToLower();
                    query = query.Where(e =>
                        e.Name.ToLower().Contains(term) ||
                        (e.Description != null && e.Description.ToLower().Contains(term)));
                }

                if (categoryId.HasValue)
                {
                    // Collect the category and all its descendants so items in subcategories are included
                    var allCategories = await _context.Categories.AsNoTracking().ToListAsync();
                    var matchingIds = new HashSet<int>();
                    var queue = new Queue<int>();
                    queue.Enqueue(categoryId.Value);
                    while (queue.Count > 0)
                    {
                        var current = queue.Dequeue();
                        matchingIds.Add(current);
                        foreach (var child in allCategories.Where(c => c.ParentCategoryId == current))
                            queue.Enqueue(child.Id);
                    }
                    query = query.Where(e => matchingIds.Contains(e.CategoryId));
                }

                if (isAvailable.HasValue)
                    query = query.Where(e => e.IsAvailable == isAvailable.Value);

                if (startDate.HasValue && endDate.HasValue)
                {
                    var start = startDate.Value.ToUniversalTime();
                    var end = endDate.Value.ToUniversalTime();
                    var activeStatuses = new[] { BookingStatus.Approved, BookingStatus.Picked };
                    // Exclude equipment that has an active booking overlapping the requested window
                    query = query.Where(e => !e.Bookings.Any(b =>
                        activeStatuses.Contains(b.Status) &&
                        b.StartDateTime < end &&
                        b.EndDateTime > start));
                }

                var equipment = await query.ToListAsync();

                // Apply Haversine radius filter in memory (after EF evaluation)
                const double R = 6371.0;
                var effectiveRadius = radiusKm ?? 10.0;
                if (latitude.HasValue && longitude.HasValue)
                {
                    equipment = equipment
                        .Where(e =>
                            e.Location?.Latitude != null && e.Location?.Longitude != null &&
                            HaversineDistance(latitude.Value, longitude.Value,
                                e.Location.Latitude!.Value, e.Location.Longitude!.Value) <= effectiveRadius)
                        .OrderBy(e => HaversineDistance(latitude.Value, longitude.Value,
                            e.Location!.Latitude!.Value, e.Location.Longitude!.Value))
                        .ToList();
                }

                var dtos = _mapper.Map<List<EquipmentResponseDto>>(equipment);

                for (var i = 0; i < dtos.Count; i++)
                {
                    var dto = dtos[i];
                    if (dto.Images != null)
                        foreach (var image in dto.Images)
                            image.ImageUrl = GetFullImageUrl(image.ImageUrl, image.EquipmentId);

                    if (latitude.HasValue && longitude.HasValue &&
                        equipment[i].Location?.Latitude != null && equipment[i].Location?.Longitude != null)
                    {
                        dto.DistanceKm = Math.Round(HaversineDistance(
                            latitude.Value, longitude.Value,
                            equipment[i].Location!.Latitude!.Value, equipment[i].Location!.Longitude!.Value), 1);
                    }
                }

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
                .AsNoTracking()
                .AsSplitQuery()
                .Include(e => e.Location)
                .Include(e => e.Images)
                .Include(e => e.Category)
                .Include(e => e.Reviews)
                    .ThenInclude(r => r.User)
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
        [Consumes("multipart/form-data")]
        public async Task<ActionResult> AddEquipmentImage([FromRoute] string id, [FromForm] AddEquipmentImageForm form)
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

            if (form?.File == null || form.File.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            try
            {
                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(form.File.FileName)}";
                var objectKey = StorageKeyHelper.Build("equipment", id, fileName);

                await using (var stream = form.File.OpenReadStream())
                {
                    await _objectStorage.SaveAsync(objectKey, stream, form.File.ContentType ?? "application/octet-stream");
                }

                // Create equipment image record
                var equipmentImage = new EquipmentImage
                {
                    Id = Guid.NewGuid().ToString(),
                    EquipmentId = id,
                    ImageUrl = objectKey,
                    IsMainImage = form.IsMainImage,
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
                    await _objectStorage.DeleteIfExistsAsync(relativePath);
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

            if (equipment.Bookings.Any())
            {
                return Conflict("Cannot delete equipment with existing bookings. Remove bookings first.");
            }

            try
            {
                _context.EquipmentImages.RemoveRange(equipment.Images);
                _context.Equipment.Remove(equipment);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateException)
            {
                return Conflict("Cannot delete equipment because related records still exist.");
            }
        }

        // GET: api/Equipment/owner/{userId}
        [HttpGet("owner/{userId}")]
        public async Task<ActionResult<IEnumerable<EquipmentResponseDto>>> GetEquipmentByOwner(string userId)
        {
            var equipment = await _context.Equipment
                .AsNoTracking()
                .AsSplitQuery()
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