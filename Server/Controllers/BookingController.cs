using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;
using AutoMapper;
using Server.Services.Storage;
using System.IO;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IObjectStorageService _objectStorage;

        public BookingController(ApplicationDbContext context, IMapper mapper, IObjectStorageService objectStorage)
        {
            _context = context;
            _mapper = mapper;
            _objectStorage = objectStorage;
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
            TransformBookingPhotoUrls(dtos);
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
            TransformBookingPhotoUrls(dtos);
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

            var dto = _mapper.Map<BookingResponseDto>(booking);
            TransformBookingPhotoUrl(dto);
            return dto;
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

            // Auto-approve if the user is the equipment owner
            booking.Status = (userId == equipment.OwnerId) ? BookingStatus.Approved : BookingStatus.Planning;
            if (booking.Status == BookingStatus.Approved)
            {
                equipment.IsAvailable = false;
            }

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Reload with related data for response
            await _context.Entry(booking).Reference(b => b.Equipment).LoadAsync();
            await _context.Entry(booking).Reference(b => b.User).LoadAsync();
            await _context.Entry(booking.Equipment).Reference(e => e.Category).LoadAsync();

            var responseDto = _mapper.Map<BookingResponseDto>(booking);
            TransformBookingPhotoUrl(responseDto);

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

                var dto = _mapper.Map<BookingResponseDto>(booking);
                TransformBookingPhotoUrl(dto);
                return dto;
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

            if (!isOwner)
            {
                var canSubmitForApproval = booking.Status == BookingStatus.Planning && statusDto == "Pending";
                var canMarkPicked = isBookingUser && booking.Status == BookingStatus.Approved && statusDto == "Picked";

                if (!canSubmitForApproval && !canMarkPicked)
                {
                    return BadRequest("Users can only change their booking status from Planning to Pending or Approved to Picked");
                }
            }

            var newStatus = Enum.Parse<BookingStatus>(statusDto);
            Console.WriteLine("StatusDto: " + newStatus);

            // User can mark an approved booking as picked up
            if (!isOwner && isBookingUser && booking.Status == BookingStatus.Approved && newStatus == BookingStatus.Picked)
            {
                booking.Status = BookingStatus.Picked;
                booking.PickedAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok();
            }

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
            if (newStatus == BookingStatus.Approved || newStatus == BookingStatus.Picked)
            {
                booking.Equipment.IsAvailable = false;
            }

            if (newStatus == BookingStatus.Picked)
            {
                booking.PickedAt = DateTime.UtcNow;
            }

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

        [HttpPost("{id}/return-request")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<BookingResponseDto>> SubmitReturnRequest(string id, [FromForm] SubmitBookingReturnRequestDto request)
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
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound();
            }

            if (booking.UserId != userId)
            {
                return Forbid();
            }

            if (booking.Status != BookingStatus.Picked)
            {
                return BadRequest("Return requests can only be created for picked bookings");
            }

            if (request.IsEarlyReturn)
            {
                if (!request.RequestedEndDateTime.HasValue)
                {
                    return BadRequest("Requested end date is required for early return requests");
                }

                if (request.RequestedEndDateTime.Value > booking.EndDateTime)
                {
                    return BadRequest("Early return date must be on or before the current booking end date");
                }

                booking.Status = BookingStatus.ReturnEarlyRequested;
                booking.ReturnRequestType = BookingReturnRequestType.Early;
                booking.ReturnRequestedEndDateTime = request.RequestedEndDateTime.Value;
            }
            else
            {
                booking.Status = BookingStatus.ReturnRequested;
                booking.ReturnRequestType = BookingReturnRequestType.Regular;
                booking.ReturnRequestedEndDateTime = null;
            }

            if (request.Photo != null)
            {
                booking.ReturnPhotoUrl = await SaveBookingReturnPhotoAsync(booking.Id, request.Photo);
            }

            booking.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var dto = _mapper.Map<BookingResponseDto>(booking);
            TransformBookingPhotoUrl(dto);
            return Ok(dto);
        }

        [HttpPatch("{id}/return-request/approve")]
        public async Task<ActionResult<BookingResponseDto>> ApproveReturnRequest(string id)
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
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound();
            }

            if (booking.Equipment.OwnerId != userId)
            {
                return Forbid();
            }

            if (booking.Status != BookingStatus.ReturnRequested && booking.Status != BookingStatus.ReturnEarlyRequested)
            {
                return BadRequest("No pending return request found");
            }

            if (booking.Status == BookingStatus.ReturnEarlyRequested)
            {
                if (!booking.ReturnRequestedEndDateTime.HasValue)
                {
                    return BadRequest("Requested end date is required for early return approvals");
                }

                booking.EndDateTime = booking.ReturnRequestedEndDateTime.Value;
                booking.Status = BookingStatus.ReturnedEarly;
            }
            else
            {
                booking.Status = BookingStatus.Returned;
            }

            booking.ReturnRequestType = null;
            booking.ReturnRequestedEndDateTime = null;
            booking.ReturnedAt = DateTime.UtcNow;
            booking.Equipment.IsAvailable = true;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var dto = _mapper.Map<BookingResponseDto>(booking);
            TransformBookingPhotoUrl(dto);
            return Ok(dto);
        }

        [HttpPatch("{id}/return-request/reject")]
        public async Task<ActionResult<BookingResponseDto>> RejectReturnRequest(string id)
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
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound();
            }

            if (booking.Equipment.OwnerId != userId)
            {
                return Forbid();
            }

            if (booking.Status != BookingStatus.ReturnRequested && booking.Status != BookingStatus.ReturnEarlyRequested)
            {
                return BadRequest("No pending return request found");
            }

            booking.Status = BookingStatus.Picked;
            booking.ReturnRequestType = null;
            booking.ReturnRequestedEndDateTime = null;
            booking.ReturnPhotoUrl = null;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var dto = _mapper.Map<BookingResponseDto>(booking);
            TransformBookingPhotoUrl(dto);
            return Ok(dto);
        }

        private bool BookingExists(string id)
        {
            return _context.Bookings.Any(e => e.Id == id);
        }

        private async Task<string> SaveBookingReturnPhotoAsync(string bookingId, IFormFile file)
        {
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
            var objectKey = StorageKeyHelper.Build("bookings", bookingId, fileName);

            await using var stream = file.OpenReadStream();
            await _objectStorage.SaveAsync(objectKey, stream, file.ContentType);
            return objectKey;
        }

        private void TransformBookingPhotoUrls(IEnumerable<BookingResponseDto> bookings)
        {
            foreach (var booking in bookings)
            {
                TransformBookingPhotoUrl(booking);
            }
        }

        private void TransformBookingPhotoUrl(BookingResponseDto booking)
        {
            if (string.IsNullOrWhiteSpace(booking.ReturnPhotoUrl))
            {
                return;
            }

            var fileName = Path.GetFileName(booking.ReturnPhotoUrl);
            booking.ReturnPhotoUrl = $"{Request.Scheme}://{Request.Host}/api/Storage/GetBookingReturnPhoto/{booking.Id}/{fileName}";
        }
    }
}