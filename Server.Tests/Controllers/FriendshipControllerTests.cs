using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Controllers;
using Server.Models;
using System.Security.Claims;
using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace Server.Tests.Controllers
{
    public class FriendshipControllerTests
    {
        private readonly FriendshipController _controller;
        private readonly ApplicationDbContext _context;
        private readonly string _currentUserId = "current-user-id";
        private readonly string _otherUserId = "other-user-id";

        public FriendshipControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _controller = new FriendshipController(_context);

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
            SeedTestData();
        }

        private void SeedTestData()
        {
            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                Name = "Current User"
            };

            var otherUser = new ApplicationUser
            {
                Id = _otherUserId,
                UserName = "otheruser@example.com",
                Email = "otheruser@example.com",
                Name = "Other User"
            };

            _context.Users.AddRange(currentUser, otherUser);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetFriends_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await _controller.GetFriends();

            // Assert
            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public async Task GetFriends_Authorized_ReturnsFriendsList()
        {
            // Arrange
            var friendship = new Friendship
            {
                RequesterId = _currentUserId,
                AddresseeId = _otherUserId,
                Status = FriendshipStatus.Accepted,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetFriends();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
            var friends = returnValue.ToList();

            Assert.Single(friends);

            // Get the anonymous object and convert to dictionary to access properties
            var friendJson = JsonSerializer.Serialize(friends[0]);
            var friendDict = JsonSerializer.Deserialize<Dictionary<string, object>>(friendJson);

            Assert.NotNull(friendDict);

            // Get the Friend object
            var friendObjectJson = friendDict["Friend"].ToString();
            var friendObjectDict = JsonSerializer.Deserialize<Dictionary<string, object>>(friendObjectJson);

            Assert.NotNull(friendObjectDict);
            Assert.Equal(_otherUserId, friendObjectDict["Id"].ToString());
            Assert.Equal("Other User", friendObjectDict["Name"].ToString());
            Assert.Equal("otheruser@example.com", friendObjectDict["Email"].ToString());
            Assert.NotNull(friendDict["CreatedAt"]);
        }

        [Fact]
        public async Task GetPendingInvitations_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await _controller.GetPendingInvitations();

            // Assert
            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public async Task GetPendingInvitations_Authorized_ReturnsPendingInvitations()
        {
            // Arrange
            var friendship = new Friendship
            {
                RequesterId = _otherUserId,
                AddresseeId = _currentUserId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetPendingInvitations();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
            var invitations = returnValue.ToList();

            Assert.Single(invitations);

            // Get the anonymous object and convert to dictionary to access properties
            var invitation = JsonSerializer.Serialize(invitations[0]);
            var invitationDict = JsonSerializer.Deserialize<Dictionary<string, object>>(invitation);

            Assert.NotNull(invitationDict);
            Assert.Equal(friendship.Id.ToString(), invitationDict["Id"].ToString());

            // Get the Requester object
            var requesterJson = invitationDict["Requester"].ToString();
            var requesterDict = JsonSerializer.Deserialize<Dictionary<string, object>>(requesterJson);

            Assert.NotNull(requesterDict);
            Assert.Equal(_otherUserId, requesterDict["Id"].ToString());
            Assert.Equal("Other User", requesterDict["Name"].ToString());
            Assert.Equal("otheruser@example.com", requesterDict["Email"].ToString());
            Assert.NotNull(invitationDict["CreatedAt"]);
        }

        [Fact]
        public async Task SendFriendRequest_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            var request = new SendFriendRequestRequest { FriendId = _otherUserId };

            // Act
            var result = await _controller.SendFriendRequest(request);

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task SendFriendRequest_ValidRequest_ReturnsOk()
        {
            // Arrange
            var request = new SendFriendRequestRequest { FriendId = _otherUserId };

            // Act
            var result = await _controller.SendFriendRequest(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = okResult.Value as dynamic;
            Assert.NotNull(returnValue);

            // Verify friendship was created
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.RequesterId == _currentUserId && f.AddresseeId == _otherUserId);
            Assert.NotNull(friendship);
            Assert.Equal(FriendshipStatus.Pending, friendship.Status);
        }

        [Fact]
        public async Task SendFriendRequest_ExistingFriendship_ReturnsBadRequest()
        {
            // Arrange
            var existingFriendship = new Friendship
            {
                RequesterId = _currentUserId,
                AddresseeId = _otherUserId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(existingFriendship);
            await _context.SaveChangesAsync();

            var request = new SendFriendRequestRequest { FriendId = _otherUserId };

            // Act
            var result = await _controller.SendFriendRequest(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Friendship request already exists", badRequestResult.Value);
        }

        [Fact]
        public async Task AcceptFriendRequest_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await _controller.AcceptFriendRequest(1);

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task AcceptFriendRequest_ValidRequest_ReturnsOk()
        {
            // Arrange
            var friendship = new Friendship
            {
                RequesterId = _otherUserId,
                AddresseeId = _currentUserId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.AcceptFriendRequest(friendship.Id);

            // Assert
            Assert.IsType<OkResult>(result);

            // Verify friendship was updated
            var updatedFriendship = await _context.Friendships.FindAsync(friendship.Id);
            Assert.NotNull(updatedFriendship);
            Assert.Equal(FriendshipStatus.Accepted, updatedFriendship.Status);
            Assert.NotNull(updatedFriendship.UpdatedAt);
        }

        [Fact]
        public async Task AcceptFriendRequest_InvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.AcceptFriendRequest(999);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Friendship request not found", notFoundResult.Value);
        }

        [Fact]
        public async Task AcceptFriendRequest_NotPending_ReturnsBadRequest()
        {
            // Arrange
            var friendship = new Friendship
            {
                RequesterId = _otherUserId,
                AddresseeId = _currentUserId,
                Status = FriendshipStatus.Accepted,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.AcceptFriendRequest(friendship.Id);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Friendship request is not pending", badRequestResult.Value);
        }

        [Fact]
        public async Task RejectFriendRequest_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await _controller.RejectFriendRequest(1);

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task RejectFriendRequest_ValidRequest_ReturnsOk()
        {
            // Arrange
            var friendship = new Friendship
            {
                RequesterId = _otherUserId,
                AddresseeId = _currentUserId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.RejectFriendRequest(friendship.Id);

            // Assert
            Assert.IsType<OkResult>(result);

            // Verify friendship was updated
            var updatedFriendship = await _context.Friendships.FindAsync(friendship.Id);
            Assert.NotNull(updatedFriendship);
            Assert.Equal(FriendshipStatus.Rejected, updatedFriendship.Status);
            Assert.NotNull(updatedFriendship.UpdatedAt);
        }

        [Fact]
        public async Task RemoveFriend_Unauthorized_ReturnsUnauthorized()
        {
            // Arrange
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await _controller.RemoveFriend(1);

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public async Task RemoveFriend_ValidRequest_ReturnsOk()
        {
            // Arrange
            var friendship = new Friendship
            {
                RequesterId = _currentUserId,
                AddresseeId = _otherUserId,
                Status = FriendshipStatus.Accepted,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.RemoveFriend(friendship.Id);

            // Assert
            Assert.IsType<OkResult>(result);

            // Verify friendship was removed
            var deletedFriendship = await _context.Friendships.FindAsync(friendship.Id);
            Assert.Null(deletedFriendship);
        }

        [Fact]
        public async Task RemoveFriend_InvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.RemoveFriend(999);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Friendship not found", notFoundResult.Value);
        }
    }
}