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

namespace Server.Tests.Controllers
{
    public class BookingControllerTests : TestBase
    {
        private readonly BookingController _controller;
        private readonly string _currentUserId = "current-user-id";
        private readonly string _otherUserId = "other-user-id";
        private readonly string _equipmentId = "test-equipment-id";
        private readonly string _locationId = "test-location-id";

        public BookingControllerTests() : base()
        {
            _controller = new BookingController(_context);

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

        private async Task SeedTestData()
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
                UserId = _otherUserId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Locations.AddAsync(location);

            // Create test equipment
            var equipment = new Equipment
            {
                Id = _equipmentId,
                Name = "Test Equipment",
                Description = "Test Description",
                OwnerId = _otherUserId,
                LocationId = _locationId,
                Location = location,
                CategoryId = 1, // Use existing seeded category
                Category = await _context.Categories.FindAsync(1),
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Equipment.AddAsync(equipment);

            // Create test bookings
            var bookings = new List<Booking>
            {
                new Booking
                {
                    Id = "booking-1",
                    EquipmentId = _equipmentId,
                    Equipment = equipment,
                    UserId = _currentUserId,
                    StartDateTime = DateTime.UtcNow.AddDays(1),
                    EndDateTime = DateTime.UtcNow.AddDays(2),
                    Status = BookingStatus.Planning,
                    CreatedAt = DateTime.UtcNow
                },
                new Booking
                {
                    Id = "booking-2",
                    EquipmentId = _equipmentId,
                    Equipment = equipment,
                    UserId = _otherUserId,
                    StartDateTime = DateTime.UtcNow.AddDays(3),
                    EndDateTime = DateTime.UtcNow.AddDays(4),
                    Status = BookingStatus.Approved,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await _context.Bookings.AddRangeAsync(bookings);
            await _context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetBookings_ReturnsUserBookings()
        {
            // Act
            var result = await _controller.GetBookings();

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<BookingResponseDto>>>(result);
            var bookings = Assert.IsAssignableFrom<IEnumerable<BookingResponseDto>>(okResult.Value);
            var bookingsList = bookings.ToList();

            Assert.Single(bookingsList);
            Assert.Equal(_currentUserId, bookingsList[0].UserId);
            Assert.Equal(_equipmentId, bookingsList[0].EquipmentId);
            Assert.Equal(BookingStatus.Planning, bookingsList[0].Status);
        }

        [Fact]
        public async Task GetBookingsForEquipment_ReturnsAllEquipmentBookings()
        {
            // Act
            var result = await _controller.GetBookingsForEquipment(_equipmentId);

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<BookingResponseDto>>>(result);
            var bookings = Assert.IsAssignableFrom<IEnumerable<BookingResponseDto>>(okResult.Value);
            var bookingsList = bookings.ToList();

            Assert.Equal(2, bookingsList.Count);
            Assert.Contains(bookingsList, b => b.UserId == _currentUserId);
            Assert.Contains(bookingsList, b => b.UserId == _otherUserId);
        }

        [Fact]
        public async Task GetBooking_ValidId_ReturnsBooking()
        {
            // Act
            var result = await _controller.GetBooking("booking-1");

            // Assert
            var okResult = Assert.IsType<ActionResult<BookingResponseDto>>(result);
            var booking = Assert.IsType<BookingResponseDto>(okResult.Value);

            Assert.Equal("booking-1", booking.Id);
            Assert.Equal(_currentUserId, booking.UserId);
            Assert.Equal(_equipmentId, booking.EquipmentId);
            Assert.Equal(BookingStatus.Planning, booking.Status);
        }

        [Fact]
        public async Task GetBooking_InvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetBooking("non-existent-id");

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateBooking_ValidData_ReturnsCreatedBooking()
        {
            // Arrange
            var createDto = new CreateBookingDto
            {
                EquipmentId = _equipmentId,
                StartDateTime = DateTime.UtcNow.AddDays(5),
                EndDateTime = DateTime.UtcNow.AddDays(6),
                Notes = "Test booking"
            };

            // Act
            var result = await _controller.CreateBooking(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var booking = Assert.IsType<BookingResponseDto>(createdResult.Value);

            Assert.Equal(_equipmentId, booking.EquipmentId);
            Assert.Equal(_currentUserId, booking.UserId);
            Assert.Equal(BookingStatus.Planning, booking.Status);
            Assert.Equal("Test booking", booking.Notes);
        }

        [Fact]
        public async Task CreateBooking_ConflictingDates_ReturnsBadRequest()
        {
            // Arrange
            var createDto = new CreateBookingDto
            {
                EquipmentId = _equipmentId,
                StartDateTime = DateTime.UtcNow.AddDays(3), // Conflicts with booking-2
                EndDateTime = DateTime.UtcNow.AddDays(4),
                Notes = "Conflicting booking"
            };

            // Act
            var result = await _controller.CreateBooking(createDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Equipment is already booked for this time period", badRequestResult.Value);
        }

        [Fact]
        public async Task UpdateBookingStatus_AsOwner_Success()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _otherUserId) // Set as equipment owner
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            // Act
            var result = await _controller.UpdateBookingStatus("booking-1", "Approved");

            // Assert
            var okResult = Assert.IsType<OkResult>(result);
            var updatedBooking = await _context.Bookings.FindAsync("booking-1");
            Assert.Equal(BookingStatus.Approved, updatedBooking.Status);
        }

        [Fact]
        public async Task UpdateBookingStatus_AsUser_PlanningToPending_Success()
        {
            // Act
            var result = await _controller.UpdateBookingStatus("booking-1", "Pending");

            // Assert
            var okResult = Assert.IsType<OkResult>(result);
            var updatedBooking = await _context.Bookings.FindAsync("booking-1");
            Assert.Equal(BookingStatus.Pending, updatedBooking.Status);
        }

        [Fact]
        public async Task UpdateBookingStatus_AsUser_InvalidTransition_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.UpdateBookingStatus("booking-1", "Approved");

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task DeleteBooking_ValidId_ReturnsNoContent()
        {
            // Act
            var result = await _controller.DeleteBooking("booking-1");

            // Assert
            Assert.IsType<NoContentResult>(result);
            var deletedBooking = await _context.Bookings.FindAsync("booking-1");
            Assert.Null(deletedBooking);
        }

        [Fact]
        public async Task DeleteBooking_InvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.DeleteBooking("non-existent-id");

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
    }
}