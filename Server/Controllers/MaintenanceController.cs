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
    public class MaintenanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public MaintenanceController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Maintenance/equipment/{equipmentId}
        [HttpGet("equipment/{equipmentId}")]
        public async Task<ActionResult<IEnumerable<MaintenanceRecordResponseDto>>> GetByEquipment(string equipmentId)
        {
            var records = await _context.MaintenanceRecords
                .AsNoTracking()
                .Where(m => m.EquipmentId == equipmentId)
                .OrderByDescending(m => m.MaintenanceDate)
                .ToListAsync();

            return Ok(_mapper.Map<List<MaintenanceRecordResponseDto>>(records));
        }

        // POST: api/Maintenance
        [HttpPost]
        public async Task<ActionResult<MaintenanceRecordResponseDto>> Create(CreateMaintenanceRecordDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var equipment = await _context.Equipment
                .FirstOrDefaultAsync(e => e.Id == dto.EquipmentId);

            if (equipment == null)
                return NotFound("Equipment not found");

            if (equipment.OwnerId != userId)
                return Forbid();

            var record = new MaintenanceRecord
            {
                EquipmentId = dto.EquipmentId,
                Title = dto.Title,
                Description = dto.Description,
                MaintenanceDate = dto.MaintenanceDate.ToUniversalTime(),
                PerformedBy = dto.PerformedBy,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.SetUnavailable)
                equipment.IsAvailable = false;

            _context.MaintenanceRecords.Add(record);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetByEquipment),
                new { equipmentId = record.EquipmentId },
                _mapper.Map<MaintenanceRecordResponseDto>(record));
        }

        // PUT: api/Maintenance/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<MaintenanceRecordResponseDto>> Update(int id, UpdateMaintenanceRecordDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var record = await _context.MaintenanceRecords
                .Include(m => m.Equipment)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null)
                return NotFound();

            if (record.Equipment.OwnerId != userId)
                return Forbid();

            if (dto.Title != null) record.Title = dto.Title;
            if (dto.Description != null) record.Description = dto.Description;
            if (dto.MaintenanceDate.HasValue) record.MaintenanceDate = dto.MaintenanceDate.Value.ToUniversalTime();
            if (dto.PerformedBy != null) record.PerformedBy = dto.PerformedBy;
            if (dto.Notes != null) record.Notes = dto.Notes;
            record.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(_mapper.Map<MaintenanceRecordResponseDto>(record));
        }

        // DELETE: api/Maintenance/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var record = await _context.MaintenanceRecords
                .Include(m => m.Equipment)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null)
                return NotFound();

            if (record.Equipment.OwnerId != userId)
                return Forbid();

            _context.MaintenanceRecords.Remove(record);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
