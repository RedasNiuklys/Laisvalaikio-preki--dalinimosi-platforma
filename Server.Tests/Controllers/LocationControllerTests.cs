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

namespace Server.Tests.Controllers
{
    public class LocationControllerTests
    {
        private readonly ApplicationDbContext _context;
        private readonly LocationController _controller;
        private readonly string _testUserId = "test-user-id";

        public LocationControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);

            // Create controller
            _controller = new LocationController(_context);

            // Setup user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        [Fact]
        public async Task GetLocations_NoLocations_ReturnsEmptyList()
        {
            // Act
            var result = await _controller.GetLocations();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<LocationResponseDto>>(okResult.Value);
            Assert.Empty(returnValue);
        }

        [Fact]
        public async Task GetLocations_WithLocations_ReturnsLocations()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Description",
                StreetAddress = "123 Test St",
                City = "Test City",
                State = "Test State",
                PostalCode = "12345",
                Country = "Test Country",
                Latitude = 45.678,
                Longitude = -123.456,
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetLocations();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<LocationResponseDto>>(okResult.Value);
            Assert.Single(returnValue);
            var returnedLocation = returnValue[0];
            Assert.Equal(location.Id, returnedLocation.Id);
            Assert.Equal(location.Description, returnedLocation.Description);
            Assert.Equal(location.State, returnedLocation.State);
            Assert.Equal(location.PostalCode, returnedLocation.PostalCode);
            Assert.Equal(location.Latitude, returnedLocation.Latitude);
            Assert.Equal(location.Longitude, returnedLocation.Longitude);
        }

        [Fact]
        public async Task GetLocation_ExistingLocation_ReturnsLocation()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Description",
                StreetAddress = "123 Test St",
                City = "Test City",
                State = "Test State",
                PostalCode = "12345",
                Country = "Test Country",
                Latitude = 45.678,
                Longitude = -123.456,
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetLocation(location.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<LocationResponseDto>(okResult.Value);
            Assert.Equal(location.Id, returnValue.Id);
            Assert.Equal(location.Description, returnValue.Description);
            Assert.Equal(location.State, returnValue.State);
            Assert.Equal(location.PostalCode, returnValue.PostalCode);
            Assert.Equal(location.Latitude, returnValue.Latitude);
            Assert.Equal(location.Longitude, returnValue.Longitude);
        }

        [Fact]
        public async Task GetLocation_NonExistingLocation_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetLocation(Guid.NewGuid().ToString());

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateLocation_ValidLocation_ReturnsCreatedLocation()
        {
            // Arrange
            var createDto = new CreateLocationDto
            {
                Name = "New Location",
                Description = "New Description",
                StreetAddress = "456 New St",
                City = "New City",
                State = "New State",
                PostalCode = "54321",
                Country = "New Country",
                Latitude = 45.678,
                Longitude = -123.456
            };

            // Act
            var result = await _controller.CreateLocation(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returnValue = Assert.IsType<LocationResponseDto>(createdResult.Value);
            Assert.Equal(createDto.Name, returnValue.Name);
            Assert.Equal(createDto.Description, returnValue.Description);
            Assert.Equal(createDto.State, returnValue.State);
            Assert.Equal(createDto.PostalCode, returnValue.PostalCode);
            Assert.Equal(createDto.Latitude, returnValue.Latitude);
            Assert.Equal(createDto.Longitude, returnValue.Longitude);
            Assert.Equal(_testUserId, returnValue.UserId);
        }

        [Fact]
        public async Task CreateLocation_InvalidLatitude_ReturnsBadRequest()
        {
            // Arrange
            var createDto = new CreateLocationDto
            {
                Name = "New Location",
                Description = "New Description",
                State = "New State",
                PostalCode = "12345",
                StreetAddress = "456 New St",
                City = "New City",
                Country = "New Country",
                Latitude = 91, // Invalid latitude
                Longitude = 0
            };

            // Act
            var result = await _controller.CreateLocation(createDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Latitude must be between -90 and 90 degrees", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task CreateLocation_InvalidLongitude_ReturnsBadRequest()
        {
            // Arrange
            var createDto = new CreateLocationDto
            {
                Name = "Test Location",
                Description = "Test Desc",
                PostalCode = "12345",
                State = "State of mind",
                StreetAddress = "123 Test St",
                City = "Test City",
                Longitude = 181,
                Latitude = 50,
                Country = "Test Country",
            };

            // Act
            var result = await _controller.CreateLocation(createDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Longitude must be between -180 and 180 degrees", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task CreateLocation_WithOptionalFields_ReturnsCreatedLocation()
        {
            // Arrange
            var createDto = new CreateLocationDto
            {
                Name = "New Location",
                StreetAddress = "456 New St",
                City = "New City",
                Country = "New Country",
                Description = "Test Description",
                State = "Test State",
                PostalCode = "12345",
                Latitude = 45.678,
                Longitude = -123.456
            };

            // Act
            var result = await _controller.CreateLocation(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returnValue = Assert.IsType<LocationResponseDto>(createdResult.Value);
            Assert.Equal(createDto.Name, returnValue.Name);
            Assert.Equal(createDto.Description, returnValue.Description);
            Assert.Equal(createDto.State, returnValue.State);
            Assert.Equal(createDto.PostalCode, returnValue.PostalCode);
            Assert.Equal(createDto.Latitude, returnValue.Latitude);
            Assert.Equal(createDto.Longitude, returnValue.Longitude);
            Assert.Equal(_testUserId, returnValue.UserId);
        }

        [Fact]
        public async Task UpdateLocation_ExistingLocation_ReturnsOk()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Description",
                StreetAddress = "123 Test St",
                City = "Test City",
                State = "Test State",
                PostalCode = "12345",
                Country = "Test Country",
                Latitude = 45.678,
                Longitude = -123.456,
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateLocationDto
            {
                Name = "Updated Location",
                Description = "Updated Description",
                StreetAddress = "789 Updated St",
                City = "Updated City",
                State = "Updated State",
                PostalCode = "54321",
                Country = "Updated Country",
                Latitude = 12.345,
                Longitude = -67.890
            };

            // Act
            var result = await _controller.UpdateLocation(location.Id, updateDto);

            // Assert
            Assert.IsType<OkResult>(result);
            var updatedLocation = await _context.Locations.FindAsync(location.Id);
            Assert.Equal(updateDto.Name, updatedLocation.Name);
            Assert.Equal(updateDto.Description, updatedLocation.Description);
            Assert.Equal(updateDto.State, updatedLocation.State);
            Assert.Equal(updateDto.PostalCode, updatedLocation.PostalCode);
            Assert.Equal(updateDto.Latitude, updatedLocation.Latitude);
            Assert.Equal(updateDto.Longitude, updatedLocation.Longitude);
        }

        [Fact]
        public async Task UpdateLocation_NonExistingLocation_ReturnsNotFound()
        {
            // Arrange
            var updateDto = new UpdateLocationDto
            {
                Name = "Updated Location",
                StreetAddress = "789 Updated St",
                City = "Updated City",
                Country = "Updated Country"
            };

            // Act
            var result = await _controller.UpdateLocation(Guid.NewGuid().ToString(), updateDto);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdateLocation_InvalidLatitude_ReturnsBadRequest()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Desc",
                PostalCode = "12345",
                State = "State of mind",
                StreetAddress = "123 Test St",
                City = "Test City",
                Country = "Test Country",
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateLocationDto
            {
                Name = "Updated Location",
                StreetAddress = "789 Updated St",
                City = "Updated City",
                Country = "Updated Country",
                Latitude = -91, // Invalid latitude
                Longitude = 0
            };

            // Act
            var result = await _controller.UpdateLocation(location.Id, updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Latitude must be between -90 and 90 degrees", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task UpdateLocation_InvalidLongitude_ReturnsBadRequest()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Desc",
                PostalCode = "12345",
                State = "State of mind",
                StreetAddress = "123 Test St",
                City = "Test City",
                Country = "Test Country",
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateLocationDto
            {
                Name = "Updated Location",
                StreetAddress = "789 Updated St",
                City = "Updated City",
                Country = "Updated Country",
                Latitude = 0,
                Longitude = -181 // Invalid longitude
            };

            // Act
            var result = await _controller.UpdateLocation(location.Id, updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Longitude must be between -180 and 180 degrees", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task UpdateLocation_WithOptionalFields_ReturnsOk()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                StreetAddress = "123 Test St",
                City = "Test City",
                State = "Test State",
                PostalCode = "12345",
                Description = "Test Desc",
                Country = "Test Country",
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateLocationDto
            {
                Name = "Updated Location",
                StreetAddress = "789 Updated St",
                City = "Updated City",
                Country = "Updated Country",
                Description = "Updated Description",
                State = "Updated State",
                PostalCode = "54321",
                Latitude = 12.345,
                Longitude = -67.890
            };

            // Act
            var result = await _controller.UpdateLocation(location.Id, updateDto);

            // Assert
            Assert.IsType<OkResult>(result);
            var updatedLocation = await _context.Locations.FindAsync(location.Id);
            Assert.Equal(updateDto.Name, updatedLocation.Name);
            Assert.Equal(updateDto.Description, updatedLocation.Description);
            Assert.Equal(updateDto.State, updatedLocation.State);
            Assert.Equal(updateDto.PostalCode, updatedLocation.PostalCode);
            Assert.Equal(updateDto.Latitude, updatedLocation.Latitude);
            Assert.Equal(updateDto.Longitude, updatedLocation.Longitude);
        }

        [Fact]
        public async Task GetLocation_WithOptionalFields_ReturnsLocation()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                StreetAddress = "123 Test St",
                City = "Test City",
                Country = "Test Country",
                Description = "Test Description",
                State = "Test State",
                PostalCode = "12345",
                Latitude = 45.678,
                Longitude = -123.456,
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetLocation(location.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<LocationResponseDto>(okResult.Value);
            Assert.Equal(location.Id, returnValue.Id);
            Assert.Equal(location.Description, returnValue.Description);
            Assert.Equal(location.State, returnValue.State);
            Assert.Equal(location.PostalCode, returnValue.PostalCode);
            Assert.Equal(location.Latitude, returnValue.Latitude);
            Assert.Equal(location.Longitude, returnValue.Longitude);
        }

        [Fact]
        public async Task GetLocations_WithOptionalFields_ReturnsLocations()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                StreetAddress = "123 Test St",
                City = "Test City",
                Country = "Test Country",
                Description = "Test Description",
                State = "Test State",
                PostalCode = "12345",
                Latitude = 45.678,
                Longitude = -123.456,
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetLocations();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<LocationResponseDto>>(okResult.Value);
            Assert.Single(returnValue);
            var returnedLocation = returnValue[0];
            Assert.Equal(location.Id, returnedLocation.Id);
            Assert.Equal(location.Description, returnedLocation.Description);
            Assert.Equal(location.State, returnedLocation.State);
            Assert.Equal(location.PostalCode, returnedLocation.PostalCode);
            Assert.Equal(location.Latitude, returnedLocation.Latitude);
            Assert.Equal(location.Longitude, returnedLocation.Longitude);
        }

        [Fact]
        public async Task DeleteLocation_ExistingLocation_ReturnsOk()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Desc",
                PostalCode = "12345",
                State = "State of mind",
                StreetAddress = "123 Test St",
                City = "Test City",
                Country = "Test Country",
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteLocation(location.Id);

            // Assert
            Assert.IsType<OkResult>(result);
            Assert.Null(await _context.Locations.FindAsync(location.Id));
        }

        [Fact]
        public async Task DeleteLocation_NonExistingLocation_ReturnsNotFound()
        {
            // Act
            var result = await _controller.DeleteLocation(Guid.NewGuid().ToString());

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GetLocationsByOwner_WithLocations_ReturnsLocations()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Description",
                StreetAddress = "123 Test St",
                City = "Test City",
                State = "Test State",
                PostalCode = "12345",
                Country = "Test Country",
                Latitude = 45.678,
                Longitude = -123.456,
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetLocationsByOwner(_testUserId);

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<LocationResponseDto>>>(result);
            var returnValue = Assert.IsType<List<LocationResponseDto>>(okResult.Value);
            Assert.Single(returnValue);
            var returnedLocation = returnValue[0];
            Assert.Equal(location.Id, returnedLocation.Id);
            Assert.Equal(location.Description, returnedLocation.Description);
            Assert.Equal(location.State, returnedLocation.State);
            Assert.Equal(location.PostalCode, returnedLocation.PostalCode);
            Assert.Equal(location.Latitude, returnedLocation.Latitude);
            Assert.Equal(location.Longitude, returnedLocation.Longitude);
        }

        [Fact]
        public async Task GetLocationsByOwner_NoLocations_ReturnsEmptyList()
        {
            // Act
            var result = await _controller.GetLocationsByOwner(Guid.NewGuid().ToString());

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<LocationResponseDto>>>(result);
            var returnValue = Assert.IsType<List<LocationResponseDto>>(okResult.Value);
            Assert.Empty(returnValue);
        }

        [Fact]
        public async Task CreateLocation_EmptyName_ReturnsBadRequest()
        {
            // Arrange
            var createDto = new CreateLocationDto
            {
                Name = "", // Empty name
                StreetAddress = "123 Test St",
                City = "Test City",
                Country = "Test Country",
                Description = "Test Desc",
                State = "Test State",
                PostalCode = "12345",
                Latitude = 45.678,
                Longitude = -123.456
            };

            // Act
            var result = await _controller.CreateLocation(createDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Name", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task CreateLocation_ExceedsStringLength_ReturnsBadRequest()
        {
            // Arrange
            var createDto = new CreateLocationDto
            {
                Name = new string('a', 101), // Exceeds 100 characters
                StreetAddress = "123 Test St",
                City = "Test City",
                Country = "Test Country",
                Description = "Test Desc",
                State = "Test State",
                PostalCode = "12345",
                Latitude = 45.678,
                Longitude = -123.456
            };

            // Act
            var result = await _controller.CreateLocation(createDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Contains("Name", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task UpdateLocation_EmptyName_ReturnsBadRequest()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                StreetAddress = "123 Test St",
                City = "Test City",
                Description = "Test Desc",
                State = "Test State",
                PostalCode = "12345",
                Country = "Test Country",
                UserId = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateLocationDto
            {
                Name = "", // Empty name
                StreetAddress = "789 Updated St",
                City = "Updated City",
                Country = "Updated Country",
                Description = "Test Desc",
                State = "Test State",
                PostalCode = "12345",
                Latitude = 45.678,
                Longitude = -123.456
            };

            // Act
            var result = await _controller.UpdateLocation(location.Id, updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Name", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task GetLocation_UnauthorizedUser_ReturnsNotFound()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                StreetAddress = "123 Test St",
                Description = "Test Desc",
                State = "Test State",
                PostalCode = "12345",
                City = "Test City",
                Country = "Test Country",
                UserId = "different-user-id", // Different user ID
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetLocation(location.Id);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task UpdateLocation_UnauthorizedUser_ReturnsNotFound()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                StreetAddress = "123 Test St",
                City = "Test City",
                Description = "Test Desc",
                State = "Test State",
                PostalCode = "12345",
                Country = "Test Country",
                UserId = "different-user-id", // Different user ID
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateLocationDto
            {
                Name = "Updated Location",
                StreetAddress = "789 Updated St",
                City = "Updated City",
                Country = "Updated Country",
                Description = "Test Desc",
                State = "Test State",
                PostalCode = "12345",
                Latitude = 45.678,
                Longitude = -123.456
            };

            // Act
            var result = await _controller.UpdateLocation(location.Id, updateDto);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteLocation_UnauthorizedUser_ReturnsNotFound()
        {
            // Arrange
            var location = new Location
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test Location",
                Description = "Test Desc",
                StreetAddress = "123 Test St",
                City = "Test City",
                PostalCode = "12345",
                State = "Test State",
                Country = "Test Country",
                UserId = "different-user-id", // Different user ID
                CreatedAt = DateTime.UtcNow
            };
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteLocation(location.Id);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

    }
}