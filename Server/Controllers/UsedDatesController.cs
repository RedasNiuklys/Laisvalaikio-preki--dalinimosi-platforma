using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsedDatesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsedDatesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/useddates/equipment/{equipmentId}
        [HttpGet("equipment/{equipmentId}")]
        public async Task<ActionResult<IEnumerable<UsedDates>>> GetUsedDatesForEquipment([FromRoute] string equipmentId)
        {
            Console.WriteLine("GetUsedDatesForEquipment");
            return await _context.UsedDates
                .Where(ud => ud.EquipmentId == equipmentId)
                .OrderBy(ud => ud.StartDate)
                .ToListAsync();
        }

        // GET: api/useddates/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<UsedDates>>> GetUsedDatesForUser([FromRoute] string userId)
        {
            return await _context.UsedDates
                .Where(ud => ud.UserId == userId)
                .OrderBy(ud => ud.StartDate)
                .ToListAsync();
        }

        // POST: api/useddates/equipment/{equipmentId}
        [HttpPost("equipment/{equipmentId}")]
        public async Task<ActionResult<UsedDates>> AddUsedDate([FromRoute] string equipmentId, [FromBody] UsedDates usedDate)
        {
            if (equipmentId != usedDate.EquipmentId)
            {
                return BadRequest("Equipment ID mismatch");
            }

            // Check if equipment exists
            var equipment = await _context.Equipment.FindAsync(equipmentId);
            if (equipment == null)
            {
                return NotFound("Equipment not found");
            }

            // Check if user exists
            var user = await _context.Users.FindAsync(usedDate.UserId);
            if (user == null)
            {
                return NotFound("User not found");
            }


// Is checked Client side
            // // Check for date overlaps
            // var hasOverlap = await _context.UsedDates
            //     .AnyAsync(ud => ud.EquipmentId == equipmentId &&
            //         ((usedDate.StartDate >= ud.StartDate && usedDate.StartDate <= ud.EndDate) ||
            //          (usedDate.EndDate >= ud.StartDate && usedDate.EndDate <= ud.EndDate) ||
            //          (usedDate.StartDate <= ud.StartDate && usedDate.EndDate >= ud.EndDate) ||
            //          (usedDate.StartDate <= ud.StartDate && usedDate.EndDate >= ud.StartDate && usedDate.EndDate <= ud.EndDate)));

            // if (hasOverlap)
            // {
            //     return BadRequest("Date range overlaps with existing bookings");
            // }

            usedDate.CreatedAt = DateTime.UtcNow;
            _context.UsedDates.Add(usedDate);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsedDatesForEquipment), new { equipmentId = usedDate.EquipmentId }, usedDate);
        }

        // PUT: api/useddates/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUsedDate(int id, UsedDates usedDate)
        {
            if (id != usedDate.Id)
            {
                return BadRequest();
            }

            var existingDate = await _context.UsedDates.FindAsync(id);
            if (existingDate == null)
            {
                return NotFound();
            }

            // Check for date overlaps excluding the current booking
            var hasOverlap = await _context.UsedDates
                .AnyAsync(ud => ud.EquipmentId == usedDate.EquipmentId &&
                    ud.Id != id &&
                    ((usedDate.StartDate >= ud.StartDate && usedDate.StartDate <= ud.EndDate) ||
                     (usedDate.EndDate >= ud.StartDate && usedDate.EndDate <= ud.EndDate) ||
                     (usedDate.StartDate <= ud.StartDate && usedDate.EndDate >= ud.EndDate)));

            if (hasOverlap)
            {
                return BadRequest("Date range overlaps with existing bookings");
            }

            existingDate.StartDate = usedDate.StartDate;
            existingDate.EndDate = usedDate.EndDate;
            existingDate.Type = usedDate.Type;
            existingDate.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UsedDateExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/useddates/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsedDate(int id)
        {
            var usedDate = await _context.UsedDates.FindAsync(id);
            if (usedDate == null)
            {
                return NotFound();
            }

            _context.UsedDates.Remove(usedDate);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/useddates/check-availability
        [HttpGet("check-availability")]
        public async Task<ActionResult<bool>> CheckAvailability(string equipmentId, DateTime startDate, DateTime endDate)
        {
            var hasOverlap = await _context.UsedDates
                .AnyAsync(ud => ud.EquipmentId == equipmentId &&
                    ((startDate >= ud.StartDate && startDate <= ud.EndDate) ||
                     (endDate >= ud.StartDate && endDate <= ud.EndDate) ||
                     (startDate <= ud.StartDate && endDate >= ud.EndDate)));

            return !hasOverlap;
        }

        private bool UsedDateExists(int id)
        {
            return _context.UsedDates.Any(e => e.Id == id);
        }
    }
} 