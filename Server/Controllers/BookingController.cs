using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;
using AutoMapper;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public BookingController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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
                    .ThenInclude(e => e.Category)
                .Include(b => b.User)
                .Where(b => b.UserId == userId)
                .ToListAsync();

            var dtos = _mapper.Map<List<BookingResponseDto>>(bookings);
            return dtos;
        }

        // GET: api/Booking/equipment/{equipmentId}
        [HttpGet("equipment/{equipmentId}")]
        public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookingsForEquipment(string equipmentId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Equipment)
                    .ThenInclude(e => e.Category)
                .Include(b => b.User)
                .Where(b => b.EquipmentId == equipmentId)
                .ToListAsync();

            var dtos = _mapper.Map<List<BookingResponseDto>>(bookings);
            return dtos;
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
                    .ThenInclude(e => e.Category)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (booking == null)
            {
                return NotFound();
            }

            return _mapper.Map<BookingResponseDto>(booking);
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

            var booking = _mapper.Map<Booking>(createDto);
            booking.Id = Guid.NewGuid().ToString();
            booking.UserId = userId;
            booking.CreatedAt = DateTime.UtcNow;

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Reload with related data for response
            await _context.Entry(booking).Reference(b => b.Equipment).LoadAsync();
            await _context.Entry(booking).Reference(b => b.User).LoadAsync();
            await _context.Entry(booking.Equipment).Reference(e => e.Category).LoadAsync();

            var responseDto = _mapper.Map<BookingResponseDto>(booking);

            return CreatedAtAction(
                nameof(GetBooking),
                new { id = booking.Id },
                responseDto);
        }

        // PUT: api/Booking/5
        [HttpPut("{id}")]
        public async Task<ActionResult<BookingResponseDto>> UpdateBooking(string id, UpdateBookingDto updateDto)
        {
            Console.WriteLine("Update booking called");
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var booking = await _context.Bookings
                .Include(b => b.Equipment)
                    .ThenInclude(e => e.Category)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == id);

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

                return _mapper.Map<BookingResponseDto>(booking);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookingExists(id))
                {
                    return NotFound();
                }
                throw;
            }
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

        // PATCH: api/Booking/5/status
        [HttpPatch("{id}/status")]
        [Authorize]
        public async Task<ActionResult> UpdateBookingStatus([FromRoute] string id, [FromBody] string statusDto)
        {
            System.Console.WriteLine(statusDto);
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var booking = await _context.Bookings
                .Include(b => b.Equipment)
                    .ThenInclude(e => e.Category)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound();
            }

            // Check if user is authorized to change the status
            // Owner can change any status, user can only change from Planning to Pending
            var isOwner = booking.Equipment.OwnerId == userId;
            var isBookingUser = booking.UserId == userId;

            if (!isOwner && !isBookingUser)
            {
                return Forbid();
            }

            if (!isOwner && (booking.Status != BookingStatus.Planning || statusDto != "Pending"))
            {
                return BadRequest("Users can only change their booking status from Planning to Pending");
            }

            var newStatus = Enum.Parse<BookingStatus>(statusDto);
            Console.WriteLine("StatusDto: " + newStatus);

            // If owner is rejecting or cancelling an approved booking, delete it
            if (isOwner &&
                booking.Status == BookingStatus.Approved &&
                (newStatus == BookingStatus.Rejected || newStatus == BookingStatus.Cancelled))
            {
                _context.Bookings.Remove(booking);
                await _context.SaveChangesAsync();
                return Ok();
            }

            // Otherwise, update the status
            booking.Status = newStatus;
            booking.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookingExists(id))
                {
                    return NotFound();
                }
                throw;
            }
        }

        private bool BookingExists(string id)
        {
            return _context.Bookings.Any(e => e.Id == id);
        }
    }
}