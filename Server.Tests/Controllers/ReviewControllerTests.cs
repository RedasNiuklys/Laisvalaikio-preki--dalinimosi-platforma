using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Server.Controllers;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;

namespace Server.Tests.Controllers
{
    public class ReviewControllerTests : TestBase
    {
        private readonly ReviewController _controller;
        private readonly IMapper _mapper;

        private const string ReviewerUserId = "reviewer-user";
        private const string OwnerUserId = "owner-user";
        private const string AnotherUserId = "another-user";
        private const string EquipmentId = "equipment-1";
        private const string LocationId = "location-1";
        private const string ApprovedBookingId = "booking-approved";
        private const string AnotherApprovedBookingId = "booking-approved-another";

        public ReviewControllerTests() : base()
        {
            _mapper = new MapperConfiguration(cfg => cfg.AddMaps(typeof(ReviewController).Assembly)).CreateMapper();
            _controller = new ReviewController(_context, _mapper);

            SetCurrentUser(ReviewerUserId);
            SeedTestData().Wait();
        }

        private void SetCurrentUser(string userId)
        {
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, userId) };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
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
            var reviewer = new ApplicationUser
            {
                Id = ReviewerUserId,
                UserName = "reviewer@example.com",
                Email = "reviewer@example.com",
                FirstName = "Review",
                LastName = "User"
            };

            var owner = new ApplicationUser
            {
                Id = OwnerUserId,
                UserName = "owner@example.com",
                Email = "owner@example.com",
                FirstName = "Owner",
                LastName = "User"
            };

            var anotherUser = new ApplicationUser
            {
                Id = AnotherUserId,
                UserName = "another@example.com",
                Email = "another@example.com",
                FirstName = "Another",
                LastName = "User"
            };

            await _context.Users.AddRangeAsync(reviewer, owner, anotherUser);

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

            var equipment = new Equipment
            {
                Id = EquipmentId,
                Name = "Test equipment",
                Description = "Test description",
                OwnerId = OwnerUserId,
                LocationId = LocationId,
                Location = location,
                CategoryId = 1,
                Category = (await _context.Categories.FindAsync(1))!,
                Condition = "Good",
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Equipment.AddAsync(equipment);

            await _context.Bookings.AddRangeAsync(
                new Booking
                {
                    Id = ApprovedBookingId,
                    EquipmentId = EquipmentId,
                    Equipment = equipment,
                    UserId = ReviewerUserId,
                    StartDateTime = DateTime.UtcNow.AddDays(-5),
                    EndDateTime = DateTime.UtcNow.AddDays(-3),
                    Status = BookingStatus.Approved,
                    CreatedAt = DateTime.UtcNow.AddDays(-6)
                },
                new Booking
                {
                    Id = AnotherApprovedBookingId,
                    EquipmentId = EquipmentId,
                    Equipment = equipment,
                    UserId = AnotherUserId,
                    StartDateTime = DateTime.UtcNow.AddDays(-4),
                    EndDateTime = DateTime.UtcNow.AddDays(-2),
                    Status = BookingStatus.Approved,
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                });

            await _context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetReviewEligibility_Owner_ReturnsOwnersCannotReviewReason()
        {
            SetCurrentUser(OwnerUserId);

            var result = await _controller.GetReviewEligibility(EquipmentId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var payload = Assert.IsType<ReviewEligibilityDto>(okResult.Value);
            Assert.False(payload.CanReview);
            Assert.Equal("owners-cannot-review", payload.Reason);
        }

        [Fact]
        public async Task GetReviewEligibility_WithApprovedBooking_ReturnsCanReviewTrue()
        {
            SetCurrentUser(ReviewerUserId);

            var result = await _controller.GetReviewEligibility(EquipmentId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var payload = Assert.IsType<ReviewEligibilityDto>(okResult.Value);
            Assert.True(payload.CanReview);
            Assert.Equal(ApprovedBookingId, payload.EligibleBookingId);
        }

        [Fact]
        public async Task GetReviewsForEquipment_ReturnsReviewsInDescendingCreatedAtOrder()
        {
            await _context.Reviews.AddRangeAsync(
                new Review
                {
                    Id = "review-older",
                    EquipmentId = EquipmentId,
                    UserId = ReviewerUserId,
                    BookingId = ApprovedBookingId,
                    Rating = 4,
                    Comment = "Older review",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new Review
                {
                    Id = "review-newer",
                    EquipmentId = EquipmentId,
                    UserId = AnotherUserId,
                    BookingId = AnotherApprovedBookingId,
                    Rating = 5,
                    Comment = "Newer review",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                });
            await _context.SaveChangesAsync();

            var result = await _controller.GetReviewsForEquipment(EquipmentId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var payload = Assert.IsType<List<ReviewResponseDto>>(okResult.Value);
            Assert.Equal(2, payload.Count);
            Assert.Equal("review-newer", payload[0].Id);
            Assert.Equal("review-older", payload[1].Id);
            Assert.Equal("another@example.com", payload[0].Reviewer.UserName);
        }

        [Fact]
        public async Task GetReviewEligibility_WithoutUser_ReturnsUnauthorized()
        {
            SetUnauthenticatedUser();

            var result = await _controller.GetReviewEligibility(EquipmentId);

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public async Task GetReviewEligibility_MissingEquipment_ReturnsNotFound()
        {
            var result = await _controller.GetReviewEligibility("missing-equipment");

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task GetReviewEligibility_AlreadyReviewedBooking_ReturnsAlreadyReviewedReason()
        {
            await _context.Reviews.AddAsync(new Review
            {
                Id = "review-existing",
                EquipmentId = EquipmentId,
                UserId = ReviewerUserId,
                BookingId = ApprovedBookingId,
                Rating = 4,
                Comment = "Existing review",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            SetCurrentUser(ReviewerUserId);
            var result = await _controller.GetReviewEligibility(EquipmentId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var payload = Assert.IsType<ReviewEligibilityDto>(okResult.Value);
            Assert.False(payload.CanReview);
            Assert.Equal("booking-already-reviewed", payload.Reason);
        }

        [Fact]
        public async Task CreateReview_ValidData_ReturnsCreatedAndPersistsReview()
        {
            SetCurrentUser(ReviewerUserId);
            var dto = new CreateReviewDto
            {
                EquipmentId = EquipmentId,
                BookingId = ApprovedBookingId,
                Rating = 5,
                Comment = "Great equipment"
            };

            var result = await _controller.CreateReview(dto);

            var created = Assert.IsType<CreatedAtActionResult>(result.Result);
            var payload = Assert.IsType<ReviewResponseDto>(created.Value);
            Assert.Equal(ReviewerUserId, payload.UserId);
            Assert.Equal(EquipmentId, payload.EquipmentId);
            Assert.Equal(ApprovedBookingId, payload.BookingId);
            Assert.Equal(5, payload.Rating);
            Assert.Equal("Great equipment", payload.Comment);
            Assert.Equal(ReviewerUserId, payload.Reviewer.Id);

            var saved = await _context.Reviews.FirstOrDefaultAsync(r => r.BookingId == ApprovedBookingId);
            Assert.NotNull(saved);
            Assert.Equal(ReviewerUserId, saved.UserId);
        }

        [Fact]
        public async Task CreateReview_ForOwnersEquipment_ReturnsBadRequest()
        {
            SetCurrentUser(OwnerUserId);
            var dto = new CreateReviewDto
            {
                EquipmentId = EquipmentId,
                BookingId = ApprovedBookingId,
                Rating = 3
            };

            var result = await _controller.CreateReview(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Owners cannot review their own equipment", badRequest.Value);
        }

        [Fact]
        public async Task CreateReview_WithoutUser_ReturnsUnauthorized()
        {
            SetUnauthenticatedUser();
            var dto = new CreateReviewDto
            {
                EquipmentId = EquipmentId,
                BookingId = ApprovedBookingId,
                Rating = 5
            };

            var result = await _controller.CreateReview(dto);

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public async Task CreateReview_MissingEquipment_ReturnsNotFound()
        {
            SetCurrentUser(ReviewerUserId);
            var dto = new CreateReviewDto
            {
                EquipmentId = "missing-equipment",
                BookingId = ApprovedBookingId,
                Rating = 5
            };

            var result = await _controller.CreateReview(dto);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Equipment not found", notFoundResult.Value);
        }

        [Fact]
        public async Task CreateReview_WithoutApprovedBooking_ReturnsBadRequest()
        {
            SetCurrentUser(ReviewerUserId);
            var dto = new CreateReviewDto
            {
                EquipmentId = EquipmentId,
                BookingId = "missing-booking",
                Rating = 4,
                Comment = "Should fail"
            };

            var result = await _controller.CreateReview(dto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Only users with an approved booking can review this equipment", badRequest.Value);
        }

        [Fact]
        public async Task CreateReview_DuplicateBookingReview_ReturnsConflict()
        {
            await _context.Reviews.AddAsync(new Review
            {
                Id = "review-duplicate",
                EquipmentId = EquipmentId,
                UserId = ReviewerUserId,
                BookingId = ApprovedBookingId,
                Rating = 4,
                Comment = "Already there",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            SetCurrentUser(ReviewerUserId);
            var dto = new CreateReviewDto
            {
                EquipmentId = EquipmentId,
                BookingId = ApprovedBookingId,
                Rating = 5,
                Comment = "Second review"
            };

            var result = await _controller.CreateReview(dto);

            var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
            Assert.Equal("This booking already has a review", conflict.Value);
        }

        [Fact]
        public async Task UpdateReview_AsAuthor_UpdatesFieldsAndReturnsOk()
        {
            var review = new Review
            {
                Id = "review-update",
                EquipmentId = EquipmentId,
                UserId = ReviewerUserId,
                BookingId = ApprovedBookingId,
                Rating = 2,
                Comment = "Old comment",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();

            SetCurrentUser(ReviewerUserId);
            var updateDto = new UpdateReviewDto
            {
                Rating = 5,
                Comment = "Updated comment"
            };

            var result = await _controller.UpdateReview(review.Id, updateDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var payload = Assert.IsType<ReviewResponseDto>(okResult.Value);
            Assert.Equal(5, payload.Rating);
            Assert.Equal("Updated comment", payload.Comment);
            Assert.NotNull(payload.UpdatedAt);

            var updated = await _context.Reviews.FindAsync(review.Id);
            Assert.NotNull(updated);
            Assert.Equal(5, updated.Rating);
            Assert.Equal("Updated comment", updated.Comment);
            Assert.NotNull(updated.UpdatedAt);
        }

        [Fact]
        public async Task UpdateReview_AsNonAuthor_ReturnsForbid()
        {
            var review = new Review
            {
                Id = "review-forbid-update",
                EquipmentId = EquipmentId,
                UserId = ReviewerUserId,
                BookingId = ApprovedBookingId,
                Rating = 3,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();

            SetCurrentUser(AnotherUserId);
            var updateDto = new UpdateReviewDto { Rating = 4 };

            var result = await _controller.UpdateReview(review.Id, updateDto);

            Assert.IsType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task UpdateReview_MissingReview_ReturnsNotFound()
        {
            var result = await _controller.UpdateReview("missing-review", new UpdateReviewDto { Rating = 4 });

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task DeleteReview_AsAuthor_ReturnsNoContentAndDeletesReview()
        {
            var review = new Review
            {
                Id = "review-delete",
                EquipmentId = EquipmentId,
                UserId = ReviewerUserId,
                BookingId = ApprovedBookingId,
                Rating = 4,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();

            SetCurrentUser(ReviewerUserId);
            var result = await _controller.DeleteReview(review.Id);

            Assert.IsType<NoContentResult>(result);
            var deleted = await _context.Reviews.FindAsync(review.Id);
            Assert.Null(deleted);
        }

        [Fact]
        public async Task DeleteReview_AsNonAuthor_ReturnsForbid()
        {
            var review = new Review
            {
                Id = "review-delete-forbid",
                EquipmentId = EquipmentId,
                UserId = ReviewerUserId,
                BookingId = ApprovedBookingId,
                Rating = 4,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();

            SetCurrentUser(AnotherUserId);
            var result = await _controller.DeleteReview(review.Id);

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task DeleteReview_MissingReview_ReturnsNotFound()
        {
            var result = await _controller.DeleteReview("missing-review");

            Assert.IsType<NotFoundResult>(result);
        }
    }
}
