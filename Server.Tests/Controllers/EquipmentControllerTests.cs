using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Controllers;
using Server.DataTransferObjects;
using Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using AutoMapper;
using Server.Services.Storage;

namespace Server.Tests.Controllers
{
    public class EquipmentControllerTests : TestBase
    {
        private readonly EquipmentController _controller;
        private readonly string _currentUserId = "current-user-id";
        private readonly string _otherUserId = "other-user-id";
        private readonly string _equipmentId = "test-equipment-id";
        private readonly string _locationId = "test-location-id";
        private readonly IMapper _mapper;
        private readonly Mock<IObjectStorageService> _objectStorageMock;

        public EquipmentControllerTests() : base()
        {
            _mapper = new MapperConfiguration(cfg => cfg.AddMaps(typeof(EquipmentController).Assembly)).CreateMapper();
            _objectStorageMock = new Mock<IObjectStorageService>();
            _controller = new EquipmentController(_context, _mapper, _objectStorageMock.Object);

            // Setup user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _currentUserId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            // Seed test data
            SeedTestData().Wait();
        }

        private new async Task SeedTestData()
        {
            // Create test users
            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                FirstName = "Current",
                LastName = "User"
            };

            var otherUser = new ApplicationUser
            {
                Id = _otherUserId,
                UserName = "otheruser@example.com",
                Email = "otheruser@example.com",
                FirstName = "Other",
                LastName = "User"
            };

            await _context.Users.AddRangeAsync(currentUser, otherUser);

            // Create test location
            var location = new Location
            {
                Id = _locationId,
                Name = "Test Location",
                Description = "Test Location Description",
                StreetAddress = "123 Test St",
                City = "Test City",
                State = "Test State",
                PostalCode = "12345",
                Country = "Test Country",
                Latitude = 0,
                Longitude = 0,
                UserId = _currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Locations.AddAsync(location);

            // Create test category
            var category = new Category
            {
                Id = 100,
                Name = "Test Category",
                IconName = "test-icon",
                Slug = "Slug"
            };

            await _context.Categories.AddAsync(category);

            // Create test equipment
            var equipment = new Equipment
            {
                Id = _equipmentId,
                Name = "Test Equipment",
                Description = "Test Description",
                OwnerId = _currentUserId,
                CategoryId = category.Id,
                Category = category,
                IsAvailable = true,
                LocationId = _locationId,
                Location = location,
                CreatedAt = DateTime.UtcNow,
                Reviews = [],
                Owner = currentUser
            };

            await _context.Equipment.AddAsync(equipment);

            // Create test equipment images
            var image = new EquipmentImage
            {
                Id = "test-image-id",
                EquipmentId = _equipmentId,
                ImageUrl = "uploads/equipment/test.jpg",
                IsMainImage = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.EquipmentImages.AddAsync(image);
            await _context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetEquipment_ReturnsAllEquipment()
        {
            // Act
            var result = await _controller.GetEquipment();

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<EquipmentResponseDto>>>(result);
            var okObjectResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var equipment = Assert.IsAssignableFrom<IEnumerable<EquipmentResponseDto>>(okObjectResult.Value);
            var equipmentList = equipment.ToList();

            Assert.Single(equipmentList);
            Assert.Equal(_equipmentId, equipmentList[0].Id);
            Assert.Equal("Test Equipment", equipmentList[0].Name);
            Assert.Equal(_currentUserId, equipmentList[0].OwnerId);
        }

        [Fact]
        public async Task GetEquipment_ById_ReturnsEquipment()
        {
            // Act
            var result = await _controller.GetEquipment(_equipmentId);

            // Assert
            var okResult = Assert.IsType<ActionResult<EquipmentResponseDto>>(result);
            var equipment = Assert.IsType<EquipmentResponseDto>(okResult.Value);

            Assert.Equal(_equipmentId, equipment.Id);
            Assert.Equal("Test Equipment", equipment.Name);
            Assert.Equal(_currentUserId, equipment.OwnerId);
            Assert.Equal("Test Category", equipment.Category.Name);
            Assert.Single(equipment.Images);
            Assert.Contains("/api/Storage/GetEquipmentImage/", equipment.Images[0].ImageUrl);
            Assert.Contains("test.jpg", equipment.Images[0].ImageUrl);
        }

        [Fact]
        public async Task GetEquipment_InvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetEquipment("non-existent-id");

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateEquipment_ValidData_ReturnsCreatedEquipment()
        {
            // Arrange
            var createDto = new CreateEquipmentDto
            {
                Name = "New Equipment",
                Description = "New Description",
                CategoryId = 100,
                Category = await _context.Categories.FindAsync(100),
                Condition = "Excellent",
                IsAvailable = true,
                LocationId = _locationId
            };

            // Act
            var result = await _controller.CreateEquipment(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var equipment = Assert.IsType<EquipmentResponseDto>(createdResult.Value);

            Assert.Equal("New Equipment", equipment.Name);
            Assert.Equal("New Description", equipment.Description);
            Assert.Equal("Excellent", equipment.Condition);
            Assert.Equal(_currentUserId, equipment.OwnerId);
            Assert.True(equipment.IsAvailable);
        }

        [Fact]
        public async Task UpdateEquipment_ValidData_ReturnsNoContent()
        {
            // Arrange
            var updateDto = new UpdateEquipmentDto
            {
                Name = "Updated Equipment",
                Description = "Updated Description",
                CategoryId = 100,
                Category = await _context.Categories.FindAsync(100),
                Condition = "Fair",
                LocationId = _locationId,
                Status = "Available"
            };

            // Act
            var result = await _controller.UpdateEquipment(_equipmentId, updateDto);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify the update
            var updatedEquipment = await _context.Equipment.FindAsync(_equipmentId);
            Assert.Equal("Updated Equipment", updatedEquipment.Name);
            Assert.Equal("Updated Description", updatedEquipment.Description);
            Assert.Equal("Fair", updatedEquipment.Condition);
            Assert.True(updatedEquipment.IsAvailable);
        }

        [Fact]
        public async Task UpdateEquipment_NonOwner_ReturnsForbid()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _otherUserId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            var updateDto = new UpdateEquipmentDto
            {
                Name = "Updated Equipment",
                Description = "Updated Description",
                CategoryId = 100,
                Category = await _context.Categories.FindAsync(100),
                Condition = "Fair",
                LocationId = _locationId
            };

            // Act
            var result = await _controller.UpdateEquipment(_equipmentId, updateDto);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task DeleteEquipment_ValidId_ReturnsNoContent()
        {
            // Act
            var result = await _controller.DeleteEquipment(_equipmentId);

            // Assert
            Assert.IsType<NoContentResult>(result);
            var deletedEquipment = await _context.Equipment.FindAsync(_equipmentId);
            Assert.Null(deletedEquipment);

            // Verify images are also deleted
            var images = await _context.EquipmentImages.Where(i => i.EquipmentId == _equipmentId).ToListAsync();
            Assert.Empty(images);
        }

        [Fact]
        public async Task DeleteEquipment_NonOwner_ReturnsForbid()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _otherUserId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            // Act
            var result = await _controller.DeleteEquipment(_equipmentId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task GetEquipmentByOwner_ReturnsOwnerEquipment()
        {
            // Act
            var result = await _controller.GetEquipmentByOwner(_currentUserId);

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<EquipmentResponseDto>>>(result);
            var equipment = Assert.IsAssignableFrom<IEnumerable<EquipmentResponseDto>>(okResult.Value);
            var equipmentList = equipment.ToList();

            Assert.Single(equipmentList);
            Assert.Equal(_equipmentId, equipmentList[0].Id);
            Assert.Equal(_currentUserId, equipmentList[0].OwnerId);
        }

        [Fact]
        public async Task GetEquipmentByOwner_NoEquipment_ReturnsEmptyList()
        {
            // Act
            var result = await _controller.GetEquipmentByOwner(_otherUserId);

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<EquipmentResponseDto>>>(result);
            var equipment = Assert.IsAssignableFrom<IEnumerable<EquipmentResponseDto>>(okResult.Value);
            Assert.Empty(equipment);
        }

        [Fact]
        public async Task GetEquipment_NoUserClaim_ReturnsUnauthorized()
        {
            // Arrange - no claims
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            var result = await _controller.GetEquipment();

            var okResult = Assert.IsType<ActionResult<IEnumerable<EquipmentResponseDto>>>(result);
            Assert.IsType<UnauthorizedResult>(okResult.Result);
        }

        [Fact]
        public async Task AddEquipmentImage_NoUserClaim_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            var result = await _controller.AddEquipmentImage(_equipmentId, new EquipmentController.AddEquipmentImageForm());
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task AddEquipmentImage_NullFile_ReturnsBadRequest()
        {
            var result = await _controller.AddEquipmentImage(_equipmentId, new EquipmentController.AddEquipmentImageForm { File = null });
            var bad = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("No file uploaded", bad.Value);
        }

        [Fact]
        public async Task AddEquipmentImage_ValidFile_ReturnsOk()
        {
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("photo.jpg");
            fileMock.Setup(f => f.Length).Returns(1024);
            fileMock.Setup(f => f.ContentType).Returns("image/jpeg");
            fileMock.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[] { 1, 2, 3 }));

            var form = new EquipmentController.AddEquipmentImageForm { File = fileMock.Object, IsMainImage = true };
            var result = await _controller.AddEquipmentImage(_equipmentId, form);

            Assert.IsType<OkResult>(result);
            _objectStorageMock.Verify(x => x.SaveAsync(It.IsAny<string>(), It.IsAny<Stream>(), It.IsAny<string>(), default), Times.Once);
        }

        [Fact]
        public async Task DeleteEquipmentImage_EquipmentNotFound_ReturnsNotFound()
        {
            var result = await _controller.DeleteEquipmentImage("nonexistent-id", "img-1");
            var notFound = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Equipment not found", notFound.Value);
        }

        [Fact]
        public async Task DeleteEquipmentImage_NotOwner_ReturnsForbid()
        {
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, _otherUserId) };
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) }
            };

            var result = await _controller.DeleteEquipmentImage(_equipmentId, "img-1");
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task DeleteEquipmentImage_ImageNotFound_ReturnsNoContent()
        {
            // Image not in DB — idempotent delete
            var result = await _controller.DeleteEquipmentImage(_equipmentId, "nonexistent-image-id");
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteEquipmentImage_ValidImage_ReturnsNoContent()
        {
            _objectStorageMock.Setup(x => x.DeleteIfExistsAsync(It.IsAny<string>(), default)).ReturnsAsync(true);

            var result = await _controller.DeleteEquipmentImage(_equipmentId, "test-image-id");
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateEquipment_NotFound_ReturnsNotFound()
        {
            var result = await _controller.UpdateEquipment("nonexistent-id", new UpdateEquipmentDto
            {
                Name = "x",
                Description = "desc",
                Condition = "Good",
                LocationId = "loc-1",
                Status = "Available"
            });
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteEquipment_NotFound_ReturnsNotFound()
        {
            var result = await _controller.DeleteEquipment("nonexistent-id");
            Assert.IsType<NotFoundResult>(result);
        }
    }
}