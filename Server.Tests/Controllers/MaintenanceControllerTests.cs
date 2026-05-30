using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Server.Controllers;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;

namespace Server.Tests.Controllers
{
    public class MaintenanceControllerTests : TestBase
    {
        private readonly MaintenanceController _controller;
        private readonly IMapper _mapper;

        private const string OwnerUserId = "owner-user";
        private const string NonOwnerUserId = "non-owner-user";
        private const string EquipmentId = "maintenance-equipment-1";
        private const string LocationId = "maintenance-location-1";

        public MaintenanceControllerTests() : base()
        {
            _mapper = new MapperConfiguration(cfg => cfg.AddMaps(typeof(MaintenanceController).Assembly)).CreateMapper();
            _controller = new MaintenanceController(_context, _mapper);

            SetCurrentUser(OwnerUserId);
            SeedTestData().Wait();
        }

        private void SetCurrentUser(string? userId)
        {
            var claims = new List<Claim>();
            if (!string.IsNullOrEmpty(userId))
                claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) }
            };
        }

        private void SetUnauthenticatedUser()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        private new async Task SeedTestData()
        {
            await _context.Users.AddRangeAsync(
                new ApplicationUser { Id = OwnerUserId, UserName = "owner@example.com", Email = "owner@example.com", FirstName = "Owner", LastName = "User" },
                new ApplicationUser { Id = NonOwnerUserId, UserName = "nonowner@example.com", Email = "nonowner@example.com", FirstName = "Non", LastName = "Owner" }
            );

            var location = new Location
            {
                Id = LocationId,
                Name = "Test Location",
                Description = "Test",
                StreetAddress = "Test st. 1",
                City = "Vilnius",
                State = "Vilnius",
                PostalCode = "00000",
                Country = "LT",
                Latitude = 54.68,
                Longitude = 25.28,
                UserId = OwnerUserId,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Locations.AddAsync(location);

            await _context.Equipment.AddAsync(new Equipment
            {
                Id = EquipmentId,
                Name = "Test Equipment",
                Description = "Test description",
                OwnerId = OwnerUserId,
                LocationId = LocationId,
                CategoryId = 1,
                Category = (await _context.Categories.FindAsync(1))!,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }

        // ── GetByEquipment ────────────────────────────────────────────────────────

        [Fact]
        public async Task GetByEquipment_NoRecords_ReturnsEmptyList()
        {
            var result = await _controller.GetByEquipment(EquipmentId);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var records = Assert.IsType<List<MaintenanceRecordResponseDto>>(ok.Value);
            Assert.Empty(records);
        }

        [Fact]
        public async Task GetByEquipment_ReturnsRecordsOrderedByDateDescending()
        {
            await _context.MaintenanceRecords.AddRangeAsync(
                new MaintenanceRecord
                {
                    EquipmentId = EquipmentId,
                    Title = "Older",
                    Description = "desc",
                    MaintenanceDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    PerformedBy = "Tech",
                    CreatedAt = DateTime.UtcNow
                },
                new MaintenanceRecord
                {
                    EquipmentId = EquipmentId,
                    Title = "Newer",
                    Description = "desc",
                    MaintenanceDate = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    PerformedBy = "Tech",
                    CreatedAt = DateTime.UtcNow
                }
            );
            await _context.SaveChangesAsync();

            var result = await _controller.GetByEquipment(EquipmentId);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var records = Assert.IsType<List<MaintenanceRecordResponseDto>>(ok.Value);
            Assert.Equal(2, records.Count);
            Assert.Equal("Newer", records[0].Title);
            Assert.Equal("Older", records[1].Title);
        }

        // ── Create ────────────────────────────────────────────────────────────────

        [Fact]
        public async Task Create_AsOwner_ReturnsCreatedRecord()
        {
            var dto = new CreateMaintenanceRecordDto
            {
                EquipmentId = EquipmentId,
                Title = "Oil change",
                Description = "Replaced oil filter",
                MaintenanceDate = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                PerformedBy = "Technician A",
                Notes = "All good"
            };

            var result = await _controller.Create(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var record = Assert.IsType<MaintenanceRecordResponseDto>(created.Value);
            Assert.Equal(EquipmentId, record.EquipmentId);
            Assert.Equal("Oil change", record.Title);
            Assert.Equal("Technician A", record.PerformedBy);

            Assert.Single(await _context.MaintenanceRecords.ToListAsync());
        }

        [Fact]
        public async Task Create_WithSetUnavailable_SetsEquipmentIsAvailableFalse()
        {
            var dto = new CreateMaintenanceRecordDto
            {
                EquipmentId = EquipmentId,
                Title = "Major repair",
                Description = "Engine overhaul",
                MaintenanceDate = DateTime.UtcNow,
                PerformedBy = "Mechanic",
                SetUnavailable = true
            };

            await _controller.Create(dto);

            var equipment = await _context.Equipment.FindAsync(EquipmentId);
            Assert.NotNull(equipment);
            Assert.False(equipment!.IsAvailable);
        }

        [Fact]
        public async Task Create_AsNonOwner_ReturnsForbid()
        {
            SetCurrentUser(NonOwnerUserId);

            var dto = new CreateMaintenanceRecordDto
            {
                EquipmentId = EquipmentId,
                Title = "Unauthorized",
                Description = "Should not work",
                MaintenanceDate = DateTime.UtcNow,
                PerformedBy = "Intruder"
            };

            var result = await _controller.Create(dto);

            Assert.IsType<ForbidResult>(result.Result);
            Assert.Empty(await _context.MaintenanceRecords.ToListAsync());
        }

        [Fact]
        public async Task Create_MissingEquipment_ReturnsNotFound()
        {
            var dto = new CreateMaintenanceRecordDto
            {
                EquipmentId = "nonexistent-equipment",
                Title = "Fix",
                Description = "desc",
                MaintenanceDate = DateTime.UtcNow,
                PerformedBy = "Tech"
            };

            var result = await _controller.Create(dto);

            var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Equipment not found", notFound.Value);
        }

        [Fact]
        public async Task Create_WithoutUser_ReturnsUnauthorized()
        {
            SetUnauthenticatedUser();

            var dto = new CreateMaintenanceRecordDto
            {
                EquipmentId = EquipmentId,
                Title = "Fix",
                Description = "desc",
                MaintenanceDate = DateTime.UtcNow,
                PerformedBy = "Tech"
            };

            var result = await _controller.Create(dto);

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        // ── Update ────────────────────────────────────────────────────────────────

        private async Task<int> AddRecordAsync(string title = "Initial")
        {
            var record = new MaintenanceRecord
            {
                EquipmentId = EquipmentId,
                Title = title,
                Description = "Initial description",
                MaintenanceDate = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                PerformedBy = "Tech",
                CreatedAt = DateTime.UtcNow
            };
            _context.MaintenanceRecords.Add(record);
            await _context.SaveChangesAsync();
            return record.Id;
        }

        [Fact]
        public async Task Update_AsOwner_UpdatesFieldsAndReturnsOk()
        {
            var id = await AddRecordAsync();

            var dto = new UpdateMaintenanceRecordDto
            {
                Title = "Updated title",
                PerformedBy = "Senior Tech",
                Notes = "Added notes"
            };

            var result = await _controller.Update(id, dto);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<MaintenanceRecordResponseDto>(ok.Value);
            Assert.Equal("Updated title", response.Title);
            Assert.Equal("Senior Tech", response.PerformedBy);
            Assert.Equal("Added notes", response.Notes);
            Assert.NotNull(response.UpdatedAt);

            var saved = await _context.MaintenanceRecords.FindAsync(id);
            Assert.Equal("Updated title", saved!.Title);
        }

        [Fact]
        public async Task Update_AsNonOwner_ReturnsForbid()
        {
            var id = await AddRecordAsync();
            SetCurrentUser(NonOwnerUserId);

            var result = await _controller.Update(id, new UpdateMaintenanceRecordDto { Title = "Hack" });

            Assert.IsType<ForbidResult>(result.Result);
            var unchanged = await _context.MaintenanceRecords.FindAsync(id);
            Assert.Equal("Initial", unchanged!.Title);
        }

        [Fact]
        public async Task Update_NotFound_ReturnsNotFound()
        {
            var result = await _controller.Update(99999, new UpdateMaintenanceRecordDto { Title = "x" });

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task Update_WithoutUser_ReturnsUnauthorized()
        {
            var id = await AddRecordAsync();
            SetUnauthenticatedUser();

            var result = await _controller.Update(id, new UpdateMaintenanceRecordDto { Title = "x" });

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        // ── Delete ────────────────────────────────────────────────────────────────

        [Fact]
        public async Task Delete_AsOwner_RemovesRecordAndReturnsNoContent()
        {
            var id = await AddRecordAsync();

            var result = await _controller.Delete(id);

            Assert.IsType<NoContentResult>(result);
            Assert.Null(await _context.MaintenanceRecords.FindAsync(id));
        }

        [Fact]
        public async Task Delete_AsNonOwner_ReturnsForbid()
        {
            var id = await AddRecordAsync();
            SetCurrentUser(NonOwnerUserId);

            var result = await _controller.Delete(id);

            Assert.IsType<ForbidResult>(result);
            Assert.NotNull(await _context.MaintenanceRecords.FindAsync(id));
        }

        [Fact]
        public async Task Delete_NotFound_ReturnsNotFound()
        {
            var result = await _controller.Delete(99999);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_WithoutUser_ReturnsUnauthorized()
        {
            var id = await AddRecordAsync();
            SetUnauthenticatedUser();

            var result = await _controller.Delete(id);

            Assert.IsType<UnauthorizedResult>(result);
        }
    }
}
