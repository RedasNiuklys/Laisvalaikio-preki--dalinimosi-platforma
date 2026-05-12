using AutoMapper;
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
    public class ReviewController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ReviewController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet("equipment/{equipmentId}")]
        public async Task<ActionResult<IEnumerable<ReviewResponseDto>>> GetReviewsForEquipment(string equipmentId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.EquipmentId == equipmentId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(_mapper.Map<List<ReviewResponseDto>>(reviews));
        }

        [HttpGet("equipment/{equipmentId}/eligibility")]
        public async Task<ActionResult<ReviewEligibilityDto>> GetReviewEligibility(string equipmentId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var equipment = await _context.Equipment
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == equipmentId);

            if (equipment == null)
            {
                return NotFound();
            }

            if (equipment.OwnerId == userId)
            {
                return Ok(new ReviewEligibilityDto
                {
                    CanReview = false,
                    Reason = "owners-cannot-review"
                });
            }

            var eligibleBooking = await _context.Bookings
                .AsNoTracking()
                .Where(b => b.EquipmentId == equipmentId && b.UserId == userId && b.Status == BookingStatus.Approved)
                .OrderByDescending(b => b.EndDateTime)
                .FirstOrDefaultAsync();

            if (eligibleBooking == null)
            {
                return Ok(new ReviewEligibilityDto
                {
                    CanReview = false,
                    Reason = "no-approved-booking"
                });
            }

            var alreadyReviewed = await _context.Reviews
                .AsNoTracking()
                .AnyAsync(r => r.BookingId == eligibleBooking.Id);

            if (alreadyReviewed)
            {
                return Ok(new ReviewEligibilityDto
                {
                    CanReview = false,
                    Reason = "booking-already-reviewed"
                });
            }

            return Ok(new ReviewEligibilityDto
            {
                CanReview = true,
                EligibleBookingId = eligibleBooking.Id
            });
        }

        [HttpPost]
        public async Task<ActionResult<ReviewResponseDto>> CreateReview(CreateReviewDto createDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var equipment = await _context.Equipment
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == createDto.EquipmentId);

            if (equipment == null)
            {
                return NotFound("Equipment not found");
            }

            if (equipment.OwnerId == userId)
            {
                return BadRequest("Owners cannot review their own equipment");
            }

            var booking = await _context.Bookings
                .AsNoTracking()
                .FirstOrDefaultAsync(b =>
                    b.Id == createDto.BookingId &&
                    b.EquipmentId == createDto.EquipmentId &&
                    b.UserId == userId &&
                    b.Status == BookingStatus.Approved);

            if (booking == null)
            {
                return BadRequest("Only users with an approved booking can review this equipment");
            }

            var alreadyReviewed = await _context.Reviews
                .AsNoTracking()
                .AnyAsync(r => r.BookingId == createDto.BookingId);

            if (alreadyReviewed)
            {
                return Conflict("This booking already has a review");
            }

            var review = _mapper.Map<Review>(createDto);
            review.Id = Guid.NewGuid().ToString();
            review.UserId = userId;
            review.CreatedAt = DateTime.UtcNow;

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            var response = await _context.Reviews
                .Include(r => r.User)
                .FirstAsync(r => r.Id == review.Id);

            return CreatedAtAction(
                nameof(GetReviewsForEquipment),
                new { equipmentId = review.EquipmentId },
                _mapper.Map<ReviewResponseDto>(response));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ReviewResponseDto>> UpdateReview(string id, UpdateReviewDto updateDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var review = await _context.Reviews
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
            {
                return NotFound();
            }

            if (review.UserId != userId)
            {
                return Forbid();
            }

            if (updateDto.Rating.HasValue)
            {
                review.Rating = updateDto.Rating.Value;
            }

            if (updateDto.Comment != null)
            {
                review.Comment = updateDto.Comment;
            }

            review.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(_mapper.Map<ReviewResponseDto>(review));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
            {
                return NotFound();
            }

            if (review.UserId != userId)
            {
                return Forbid();
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
