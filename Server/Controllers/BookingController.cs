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
    public class BookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BookingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Booking
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookings()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var bookings = await _context.Bookings
                .Include(b => b.Equipment)
                .Include(b => b.User)
                .Where(b => b.UserId == userId)
                .Select(b => new BookingResponseDto
                {
                    Id = b.Id,
                    EquipmentId = b.EquipmentId,
                    UserId = b.UserId,
                    StartDateTime = b.StartDateTime,
                    EndDateTime = b.EndDateTime,
                    Status = b.Status,
                    Notes = b.Notes,
                    CreatedAt = b.CreatedAt,
                    UpdatedAt = b.UpdatedAt,
                    Equipment = new EquipmentResponseDto
                    {
                        Id = b.Equipment.Id,
                        Name = b.Equipment.Name,
                        Description = b.Equipment.Description,
                        Category = new CategoryDto
                        {
                            Id = b.Equipment.Category.Id,
                            Name = b.Equipment.Category.Name,
                            IconName = b.Equipment.Category.IconName,
                            ParentCategoryId = b.Equipment.Category.ParentCategoryId
                        },
                        Condition = b.Equipment.Condition,
                        OwnerId = b.Equipment.OwnerId,
                        IsAvailable = b.Equipment.IsAvailable,
                        CreatedAt = b.Equipment.CreatedAt,
                        UpdatedAt = b.Equipment.UpdatedAt
                    },
                    User = new UserResponseDto
                    {
                        Id = b.User.Id,
                        UserName = b.User.UserName,
                        Email = b.User.Email,
                        FirstName = b.User.FirstName,
                        LastName = b.User.LastName
                    }
                })
                .ToListAsync();

            return bookings;
        }

        // GET: api/Booking/equipment/{equipmentId}
        [HttpGet("equipment/{equipmentId}")]
        public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookingsForEquipment(string equipmentId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Equipment)
                .Include(b => b.User)
                .Where(b => b.EquipmentId == equipmentId)
                .Select(b => new BookingResponseDto
                {
                    Id = b.Id,
                    EquipmentId = b.EquipmentId,
                    UserId = b.UserId,
                    StartDateTime = b.StartDateTime,
                    EndDateTime = b.EndDateTime,
                    Status = b.Status,
                    Notes = b.Notes,
                    CreatedAt = b.CreatedAt,
                    UpdatedAt = b.UpdatedAt,
                    Equipment = new EquipmentResponseDto
                    {
                        Id = b.Equipment.Id,
                        Name = b.Equipment.Name,
                        Description = b.Equipment.Description,
                        Category = new CategoryDto
                        {
                            Id = b.Equipment.Category.Id,
                            Name = b.Equipment.Category.Name,
                            IconName = b.Equipment.Category.IconName,
                            ParentCategoryId = b.Equipment.Category.ParentCategoryId
                        },
                        Condition = b.Equipment.Condition,
                        OwnerId = b.Equipment.OwnerId,
                        IsAvailable = b.Equipment.IsAvailable,
                        CreatedAt = b.Equipment.CreatedAt,
                        UpdatedAt = b.Equipment.UpdatedAt
                    },
                    User = new UserResponseDto
                    {
                        Id = b.User.Id,
                        UserName = b.User.UserName,
                        Email = b.User.Email,
                        FirstName = b.User.FirstName,
                        LastName = b.User.LastName
                    }
                })
                .ToListAsync();

            return bookings;
        }

        // GET: api/Booking/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BookingResponseDto>> GetBooking(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var booking = await _context.Bookings
                .Include(b => b.Equipment)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (booking == null)
            {
                return NotFound();
            }

            return new BookingResponseDto
            {
                Id = booking.Id,
                EquipmentId = booking.EquipmentId,
                UserId = booking.UserId,
                StartDateTime = booking.StartDateTime,
                EndDateTime = booking.EndDateTime,
                Status = booking.Status,
                Notes = booking.Notes,
                CreatedAt = booking.CreatedAt,
                UpdatedAt = booking.UpdatedAt,
                Equipment = new EquipmentResponseDto
                {
                    Id = booking.Equipment.Id,
                    Name = booking.Equipment.Name,
                    Description = booking.Equipment.Description,
                    Category = new CategoryDto
                    {
                        Id = booking.Equipment.Category.Id,
                        Name = booking.Equipment.Category.Name,
                        IconName = booking.Equipment.Category.IconName,
                        ParentCategoryId = booking.Equipment.Category.ParentCategoryId
                    },
                    Condition = booking.Equipment.Condition,
                    OwnerId = booking.Equipment.OwnerId,
                    IsAvailable = booking.Equipment.IsAvailable,
                    CreatedAt = booking.Equipment.CreatedAt,
                    UpdatedAt = booking.Equipment.UpdatedAt
                },
                User = new UserResponseDto
                {
                    Id = booking.User.Id,
                    UserName = booking.User.UserName,
                    Email = booking.User.Email,
                    FirstName = booking.User.FirstName,
                    LastName = booking.User.LastName
                }
            };
        }

        // POST: api/Booking
        [HttpPost]
        public async Task<ActionResult<BookingResponseDto>> CreateBooking(CreateBookingDto createDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var equipment = await _context.Equipment.FindAsync(createDto.EquipmentId);
            if (equipment == null)
            {
                return NotFound("Equipment not found");
            }

            // Check if the equipment is available for the requested time period
            var conflictingBooking = await _context.Bookings
                .Where(b => b.EquipmentId == createDto.EquipmentId && b.Status != BookingStatus.Planning)
                .Where(b =>
                    (createDto.StartDateTime.Date <= b.EndDateTime.Date && createDto.EndDateTime.Date >= b.StartDateTime.Date) ||
                    (createDto.StartDateTime.Date >= b.StartDateTime.Date && createDto.StartDateTime.Date <= b.EndDateTime.Date))
                .FirstOrDefaultAsync();

            if (conflictingBooking != null)
            {
                return BadRequest("Equipment is already booked for this time period");
            }

            var booking = new Booking
            {
                Id = Guid.NewGuid().ToString(),
                EquipmentId = createDto.EquipmentId,
                UserId = userId,
                StartDateTime = createDto.StartDateTime,
                EndDateTime = createDto.EndDateTime,
                Status = BookingStatus.Planning,
                Notes = createDto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetBooking),
                new { id = booking.Id },
                new BookingResponseDto
                {
                    Id = booking.Id,
                    EquipmentId = booking.EquipmentId,
                    UserId = booking.UserId,
                    StartDateTime = booking.StartDateTime,
                    EndDateTime = booking.EndDateTime,
                    Status = booking.Status,
                    Notes = booking.Notes,
                    CreatedAt = booking.CreatedAt,
                    UpdatedAt = booking.UpdatedAt
                });
        }

        // PUT: api/Booking/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBooking(string id, UpdateBookingDto updateDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null || booking.UserId != userId)
            {
                return NotFound();
            }

            if (updateDto.StartDateTime.HasValue) booking.StartDateTime = updateDto.StartDateTime.Value;
            if (updateDto.EndDateTime.HasValue) booking.EndDateTime = updateDto.EndDateTime.Value;
            if (updateDto.Status.HasValue) booking.Status = updateDto.Status.Value;
            if (updateDto.Notes != null) booking.Notes = updateDto.Notes;
            booking.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookingExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Booking/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null || booking.UserId != userId)
            {
                return NotFound();
            }

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BookingExists(string id)
        {
            return _context.Bookings.Any(e => e.Id == id);
        }
    }
}