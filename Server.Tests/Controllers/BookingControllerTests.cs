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
using AutoMapper;
using Moq;
using Server.Services.Storage;
using Server.Services;
using System.IO;
using Microsoft.AspNetCore.SignalR;
using Server.Hubs;

namespace Server.Tests.Controllers
{
    public class BookingControllerTests : TestBase
    {
        private readonly BookingController _controller;
        private readonly IMapper _mapper;
        private readonly string _currentUserId = "current-user-id";
        private readonly string _otherUserId = "other-user-id";
        private readonly string _equipmentId = "test-equipment-id";
        private readonly string _locationId = "test-location-id";
        private readonly Mock<IObjectStorageService> _objectStorageMock;
        private readonly Mock<IHubContext<ChatHub>> _hubContextMock;

        public BookingControllerTests() : base()
        {
            _mapper = new MapperConfiguration(cfg => cfg.AddMaps(typeof(BookingController).Assembly)).CreateMapper();
            _objectStorageMock = new Mock<IObjectStorageService>();

            _hubContextMock = new Mock<IHubContext<ChatHub>>();
            var mockClients = new Mock<IHubClients>();
            var mockClientProxy = new Mock<IClientProxy>();
            _hubContextMock.Setup(h => h.Clients).Returns(mockClients.Object);
            mockClients.Setup(c => c.User(It.IsAny<string>())).Returns(mockClientProxy.Object);
            mockClientProxy
                .Setup(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var pushNotificationService = new PushNotificationService(
                new Moq.Mock<System.Net.Http.IHttpClientFactory>().Object);
            var notificationService = new NotificationService(_context, pushNotificationService, _hubContextMock.Object);

            _controller = new BookingController(_context, _mapper, _objectStorageMock.Object, _hubContextMock.Object, notificationService);

            SetCurrentUser(_currentUserId);

            // Seed test data
            SeedTestData().Wait();
        }

        private void SetCurrentUser(string? userId)
        {
            var claims = new List<Claim>();
            if (!string.IsNullOrEmpty(userId))
            {
                claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
            }

            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
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
        public async Task GetBookings_WithoutUser_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.GetBookings();

            Assert.IsType<UnauthorizedResult>(result.Result);
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
        public async Task CreateBooking_MissingEquipment_ReturnsNotFound()
        {
            var createDto = new CreateBookingDto
            {
                EquipmentId = "missing-equipment",
                StartDateTime = DateTime.UtcNow.AddDays(5),
                EndDateTime = DateTime.UtcNow.AddDays(6),
            };

            var result = await _controller.CreateBooking(createDto);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Equipment not found", notFoundResult.Value);
        }

        [Fact]
        public async Task CreateBooking_AsOwner_AutoApprovesBooking()
        {
            SetCurrentUser(_otherUserId);
            var createDto = new CreateBookingDto
            {
                EquipmentId = _equipmentId,
                StartDateTime = DateTime.UtcNow.AddDays(10),
                EndDateTime = DateTime.UtcNow.AddDays(11),
                Notes = "Owner booking"
            };

            var result = await _controller.CreateBooking(createDto);

            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var booking = Assert.IsType<BookingResponseDto>(createdResult.Value);
            Assert.Equal(BookingStatus.Approved, booking.Status);
            Assert.Equal(_otherUserId, booking.UserId);
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
        public async Task UpdateBookingStatus_NonParticipant_ReturnsForbid()
        {
            SetCurrentUser("outsider-user-id");

            var result = await _controller.UpdateBookingStatus("booking-1", "Pending");

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task UpdateBookingStatus_OwnerRejectsApprovedBooking_DeletesBooking()
        {
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-approved-delete",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(7),
                EndDateTime = DateTime.UtcNow.AddDays(8),
                Status = BookingStatus.Approved,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            SetCurrentUser(_otherUserId);
            var result = await _controller.UpdateBookingStatus("booking-approved-delete", "Rejected");

            Assert.IsType<OkResult>(result);
            Assert.Null(await _context.Bookings.FindAsync("booking-approved-delete"));
        }

        [Fact]
        public async Task UpdateBooking_ValidUpdate_ReturnsUpdatedBooking()
        {
            // Arrange
            var booking = new Booking
            {
                Id = "booking-update",
                UserId = _currentUserId,
                EquipmentId = _equipmentId,
                StartDateTime = DateTime.UtcNow.AddDays(1),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.Planning,
                Notes = "Original notes",
                CreatedAt = DateTime.UtcNow
            };

            await _context.Bookings.AddAsync(booking);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateBookingDto
            {
                StartDateTime = DateTime.UtcNow.AddDays(3),
                EndDateTime = DateTime.UtcNow.AddDays(4),
                Status = BookingStatus.Pending,
                Notes = "Updated notes"
            };

            // Act
            var result = await _controller.UpdateBooking("booking-update", updateDto);

            // Assert
            var response = Assert.IsType<BookingResponseDto>(result.Value);
            Assert.NotNull(response);
            Assert.Equal("booking-update", response.Id);
            Assert.Equal(updateDto.Notes, response.Notes);
            Assert.Equal(updateDto.Status.ToString(), response.Status.ToString());

            // Verify database was updated
            var updatedBooking = await _context.Bookings.FindAsync("booking-update");
            Assert.NotNull(updatedBooking);
            Assert.Equal(updateDto.Notes, updatedBooking.Notes);
            Assert.Equal(BookingStatus.Pending, updatedBooking.Status);
        }

        [Fact]
        public async Task UpdateBooking_NonOwner_ReturnsNotFound()
        {
            // Arrange
            var booking = new Booking
            {
                Id = "booking-other-user",
                UserId = _otherUserId,
                EquipmentId = _equipmentId,
                StartDateTime = DateTime.UtcNow.AddDays(1),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.Planning,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Bookings.AddAsync(booking);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateBookingDto
            {
                Notes = "Trying to update someone else's booking"
            };

            // Act
            var result = await _controller.UpdateBooking("booking-other-user", updateDto);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task UpdateBooking_InvalidId_ReturnsNotFound()
        {
            // Arrange
            var updateDto = new UpdateBookingDto
            {
                Notes = "Updating non-existent booking"
            };

            // Act
            var result = await _controller.UpdateBooking("non-existent-booking", updateDto);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
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

        [Fact]
        public async Task UpdateBookingStatus_AsBookingUser_ApprovedToPicked_SetsPickedAt()
        {
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-approved-pick",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(1),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.Approved,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var result = await _controller.UpdateBookingStatus("booking-approved-pick", "Picked");

            Assert.IsType<OkResult>(result);
            var updatedBooking = await _context.Bookings.FindAsync("booking-approved-pick");
            Assert.NotNull(updatedBooking);
            Assert.Equal(BookingStatus.Picked, updatedBooking!.Status);
            Assert.NotNull(updatedBooking.PickedAt);
        }

        [Fact]
        public async Task SubmitReturnRequest_RegularPickedBooking_ReturnsOkAndUpdatesStatus()
        {
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-picked-regular-return",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(-2),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.Picked,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var dto = new SubmitBookingReturnRequestDto { IsEarlyReturn = false };
            var result = await _controller.SubmitReturnRequest("booking-picked-regular-return", dto);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<BookingResponseDto>(ok.Value);
            Assert.Equal(BookingStatus.ReturnRequested, response.Status);

            var updated = await _context.Bookings.FindAsync("booking-picked-regular-return");
            Assert.NotNull(updated);
            Assert.Equal(BookingStatus.ReturnRequested, updated!.Status);
            Assert.Equal(BookingReturnRequestType.Regular, updated.ReturnRequestType);
            Assert.Null(updated.ReturnRequestedEndDateTime);
        }

        [Fact]
        public async Task SubmitReturnRequest_EarlyWithoutDate_ReturnsBadRequest()
        {
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-picked-early-missing-date",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(-2),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.Picked,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var dto = new SubmitBookingReturnRequestDto { IsEarlyReturn = true, RequestedEndDateTime = null };
            var result = await _controller.SubmitReturnRequest("booking-picked-early-missing-date", dto);

            var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Requested end date is required for early return requests", bad.Value);
        }

        [Fact]
        public async Task SubmitReturnRequest_WithPhoto_SavesObjectAndSetsPhotoUrl()
        {
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-picked-with-photo",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(-2),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.Picked,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            await using var ms = new MemoryStream(new byte[] { 1, 2, 3, 4 });
            IFormFile file = new FormFile(ms, 0, ms.Length, "photo", "proof.jpg")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/jpeg"
            };

            var dto = new SubmitBookingReturnRequestDto
            {
                IsEarlyReturn = false,
                Photo = file
            };

            var result = await _controller.SubmitReturnRequest("booking-picked-with-photo", dto);

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<BookingResponseDto>(ok.Value);
            Assert.Contains("/api/Storage/GetBookingReturnPhoto/booking-picked-with-photo/", response.ReturnPhotoUrl);

            var updated = await _context.Bookings.FindAsync("booking-picked-with-photo");
            Assert.NotNull(updated);
            Assert.False(string.IsNullOrWhiteSpace(updated!.ReturnPhotoUrl));
            _objectStorageMock.Verify(s => s.SaveAsync(It.IsAny<string>(), It.IsAny<Stream>(), "image/jpeg", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ApproveReturnRequest_Regular_SetsReturnedAndEquipmentAvailable()
        {
            var booking = new Booking
            {
                Id = "booking-return-requested",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(-3),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.ReturnRequested,
                ReturnRequestType = BookingReturnRequestType.Regular,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Bookings.AddAsync(booking);
            await _context.SaveChangesAsync();

            var equipment = await _context.Equipment.FindAsync(_equipmentId);
            equipment!.IsAvailable = false;
            await _context.SaveChangesAsync();

            SetCurrentUser(_otherUserId);
            var result = await _controller.ApproveReturnRequest("booking-return-requested");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<BookingResponseDto>(ok.Value);
            Assert.Equal(BookingStatus.Returned, response.Status);

            var updated = await _context.Bookings.FindAsync("booking-return-requested");
            Assert.NotNull(updated);
            Assert.Equal(BookingStatus.Returned, updated!.Status);
            Assert.NotNull(updated.ReturnedAt);

            var updatedEquipment = await _context.Equipment.FindAsync(_equipmentId);
            Assert.True(updatedEquipment!.IsAvailable);
        }

        [Fact]
        public async Task ApproveReturnRequest_Early_ShortensEndDateAndSetsReturnedEarly()
        {
            var requestedEnd = DateTime.UtcNow.AddHours(1);
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-early-return-requested",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(-3),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.ReturnEarlyRequested,
                ReturnRequestType = BookingReturnRequestType.Early,
                ReturnRequestedEndDateTime = requestedEnd,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            SetCurrentUser(_otherUserId);
            var result = await _controller.ApproveReturnRequest("booking-early-return-requested");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<BookingResponseDto>(ok.Value);
            Assert.Equal(BookingStatus.ReturnedEarly, response.Status);

            var updated = await _context.Bookings.FindAsync("booking-early-return-requested");
            Assert.NotNull(updated);
            Assert.Equal(BookingStatus.ReturnedEarly, updated!.Status);
            Assert.Equal(requestedEnd, updated.EndDateTime, TimeSpan.FromSeconds(1));
            Assert.Null(updated.ReturnRequestedEndDateTime);
            Assert.Null(updated.ReturnRequestType);
        }

        [Fact]
        public async Task RejectReturnRequest_ValidRequest_RevertsToPickedAndClearsRequestFields()
        {
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-return-to-reject",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(-3),
                EndDateTime = DateTime.UtcNow.AddDays(2),
                Status = BookingStatus.ReturnRequested,
                ReturnRequestType = BookingReturnRequestType.Regular,
                ReturnPhotoUrl = "bookings/booking-return-to-reject/proof.jpg",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            SetCurrentUser(_otherUserId);
            var result = await _controller.RejectReturnRequest("booking-return-to-reject");

            var ok = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<BookingResponseDto>(ok.Value);
            Assert.Equal(BookingStatus.Picked, response.Status);

            var updated = await _context.Bookings.FindAsync("booking-return-to-reject");
            Assert.NotNull(updated);
            Assert.Equal(BookingStatus.Picked, updated!.Status);
            Assert.Null(updated.ReturnRequestType);
            Assert.Null(updated.ReturnRequestedEndDateTime);
            Assert.Null(updated.ReturnPhotoUrl);
        }

        [Fact]
        public async Task ApproveReturnRequest_NonOwner_ReturnsForbid()
        {
            await _context.Bookings.AddAsync(new Booking
            {
                Id = "booking-return-forbid",
                EquipmentId = _equipmentId,
                UserId = _currentUserId,
                StartDateTime = DateTime.UtcNow.AddDays(-1),
                EndDateTime = DateTime.UtcNow.AddDays(1),
                Status = BookingStatus.ReturnRequested,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            SetCurrentUser(_currentUserId);
            var result = await _controller.ApproveReturnRequest("booking-return-forbid");

            Assert.IsType<ForbidResult>(result.Result);
        }
    }
}