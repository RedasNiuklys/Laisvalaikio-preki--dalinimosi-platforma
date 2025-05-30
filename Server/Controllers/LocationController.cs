using System.Data.SqlTypes;
using System.Security.Claims;
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
    public class LocationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LocationController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Location
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LocationResponseDto>>> GetLocations()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"Current User ID: {userId}");
            List<LocationResponseDto> locations = new List<LocationResponseDto>();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            locations = await _context.Locations
                .Where(l => l.UserId == userId)
                .Select(l => new LocationResponseDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    Description = l.Description,
                    StreetAddress = l.StreetAddress,
                    City = l.City,
                    State = l.State,
                    PostalCode = l.PostalCode,
                    Country = l.Country,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    UserId = l.UserId,
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = l.UpdatedAt
                })
                .ToListAsync();

            Console.WriteLine($"Found {locations.Count} locations for user {userId}");
            return Ok(locations);
        }

        // GET: api/Location/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LocationResponseDto>> GetLocation(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var location = await _context.Locations
                .Where(l => l.Id == id && l.UserId == userId)
                .Select(l => new LocationResponseDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    Description = l.Description,
                    StreetAddress = l.StreetAddress,
                    City = l.City,
                    State = l.State,
                    PostalCode = l.PostalCode,
                    Country = l.Country,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    UserId = l.UserId,
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = l.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (location == null)
            {
                return NotFound();
            }

            return Ok(location);
        }

        // POST: api/Location
        [HttpPost]
        public async Task<ActionResult<LocationResponseDto>> CreateLocation(CreateLocationDto createLocationDto)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(createLocationDto.Name))
            {
                return BadRequest("Name is required");
            }
            else if (createLocationDto.Name.Length > 100)
            {
                return BadRequest("Name must be less than 100 characters");
            }
            if (string.IsNullOrWhiteSpace(createLocationDto.StreetAddress))
            {
                return BadRequest("Street address is required");
            }
            if (string.IsNullOrWhiteSpace(createLocationDto.City))
            {
                return BadRequest("City is required");
            }
            if (string.IsNullOrWhiteSpace(createLocationDto.Country))
            {
                return BadRequest("Country is required");
            }
            if (string.IsNullOrWhiteSpace(createLocationDto.Description))
            {
                return BadRequest("Description is required");
            }
            if (string.IsNullOrWhiteSpace(createLocationDto.State))
            {
                return BadRequest("State is required");
            }
            if (string.IsNullOrWhiteSpace(createLocationDto.PostalCode))
            {
                return BadRequest("Postal code is required");
            }

            // Validate coordinates
            if (createLocationDto.Latitude.HasValue && (createLocationDto.Latitude < -90 || createLocationDto.Latitude > 90))
            {
                return BadRequest("Latitude must be between -90 and 90 degrees");
            }

            if (createLocationDto.Longitude.HasValue && (createLocationDto.Longitude < -180 || createLocationDto.Longitude > 180))
            {
                return BadRequest("Longitude must be between -180 and 180 degrees");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            System.Console.WriteLine("Came to CreateLocation");

            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = createLocationDto.Name,
                Description = createLocationDto.Description,
                StreetAddress = createLocationDto.StreetAddress,
                City = createLocationDto.City,
                State = createLocationDto.State,
                PostalCode = createLocationDto.PostalCode,
                Country = createLocationDto.Country,
                Latitude = createLocationDto.Latitude,
                Longitude = createLocationDto.Longitude,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetLocation),
                new { id = location.Id },
                new LocationResponseDto
                {
                    Id = location.Id,
                    Name = location.Name,
                    Description = location.Description,
                    StreetAddress = location.StreetAddress,
                    City = location.City,
                    State = location.State,
                    PostalCode = location.PostalCode,
                    Country = location.Country,
                    Latitude = location.Latitude,
                    Longitude = location.Longitude,
                    UserId = location.UserId,
                    CreatedAt = location.CreatedAt,
                    UpdatedAt = location.UpdatedAt
                });
        }

        // Patch: api/Location/5
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateLocation(string id, UpdateLocationDto updateLocationDto)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(updateLocationDto.Name))
            {
                return BadRequest("Name is required");
            }
            else if (updateLocationDto.Name.Length > 100)
            {
                return BadRequest("Name must be less than 100 characters");
            }
            if (string.IsNullOrWhiteSpace(updateLocationDto.StreetAddress))
            {
                return BadRequest("Street address is required");
            }
            if (string.IsNullOrWhiteSpace(updateLocationDto.City))
            {
                return BadRequest("City is required");
            }
            if (string.IsNullOrWhiteSpace(updateLocationDto.Country))
            {
                return BadRequest("Country is required");
            }

            // Validate coordinates
            if (updateLocationDto.Latitude.HasValue && (updateLocationDto.Latitude < -90 || updateLocationDto.Latitude > 90))
            {
                return BadRequest("Latitude must be between -90 and 90 degrees");
            }

            if (updateLocationDto.Longitude.HasValue && (updateLocationDto.Longitude < -180 || updateLocationDto.Longitude > 180))
            {
                return BadRequest("Longitude must be between -180 and 180 degrees");
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

            if (location == null)
            {
                return NotFound();
            }

            location.Name = updateLocationDto.Name;
            location.Description = updateLocationDto.Description;
            location.StreetAddress = updateLocationDto.StreetAddress;
            location.City = updateLocationDto.City;
            location.State = updateLocationDto.State;
            location.PostalCode = updateLocationDto.PostalCode;
            location.Country = updateLocationDto.Country;
            location.Latitude = updateLocationDto.Latitude;
            location.Longitude = updateLocationDto.Longitude;
            location.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LocationExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return Ok();
        }

        // DELETE: api/Location/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

            if (location == null)
            {
                return NotFound();
            }

            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();

            return Ok();
        }

        private bool LocationExists(string id)
        {
            return _context.Locations.Any(e => e.Id == id);
        }

        // GET: api/Location/owner/{id}
        [HttpGet("owner/{id}")]
        public async Task<ActionResult<IEnumerable<LocationResponseDto>>> GetLocationsByOwner(string id)
        {
            var locations = await _context.Locations
                .Where(l => l.UserId == id)
                .Select(l => new LocationResponseDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    Description = l.Description,
                    StreetAddress = l.StreetAddress,
                    City = l.City,
                    State = l.State,
                    PostalCode = l.PostalCode,
                    Country = l.Country,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    UserId = l.UserId,
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = l.UpdatedAt
                })
                .ToListAsync();

            return locations;
        }
    }
}