using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Server.Hubs;
using Server.Models;
using System.Security.Claims;
using Xunit;

namespace Server.Tests.Hubs
{
    public class ChatHubTests : TestBase
    {
        private readonly ChatHub _hub;
        private readonly Mock<IHubCallerClients> _mockClients;
        private readonly Mock<IClientProxy> _mockClientProxy;
        private readonly Mock<HubCallerContext> _mockHubContext;
        private readonly Mock<IGroupManager> _mockGroups;
        private readonly string _testUserId = "test-user-id";
        private readonly string _testConnectionId = "test-connection-id";

        public ChatHubTests() : base()
        {
            // Setup hub mocks
            _mockClients = new Mock<IHubCallerClients>();
            _mockClientProxy = new Mock<IClientProxy>();
            _mockHubContext = new Mock<HubCallerContext>();
            _mockGroups = new Mock<IGroupManager>();

            // Setup hub context with claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _mockHubContext.Setup(x => x.User).Returns(principal);
            _mockHubContext.Setup(x => x.ConnectionId).Returns(_testConnectionId);

            // Setup hub
            _hub = new ChatHub(_context)
            {
                Clients = _mockClients.Object,
                Context = _mockHubContext.Object,
                Groups = _mockGroups.Object
            };

            // Seed test data
            SeedTestData().Wait();
        }

        private async Task SeedTestData()
        {
            // Create test users
            var testUser = new ApplicationUser
            {
                Id = _testUserId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            var otherUser = new ApplicationUser
            {
                Id = "other-user-id",
                UserName = "otheruser@example.com",
                Email = "otheruser@example.com",
                FirstName = "Other",
                LastName = "User"
            };

            await _context.Users.AddRangeAsync(testUser, otherUser);

            // Create test chat
            var chat = new Chat
            {
                Id = 1,
                Name = "Test Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Chats.AddAsync(chat);

            // Add chat participants
            var participants = new List<ChatParticipant>
            {
                new ChatParticipant
                {
                    ChatId = chat.Id,
                    UserId = _testUserId,
                    IsAdmin = true,
                    JoinedAt = DateTime.UtcNow
                },
                new ChatParticipant
                {
                    ChatId = chat.Id,
                    UserId = "other-user-id",
                    IsAdmin = false,
                    JoinedAt = DateTime.UtcNow
                }
            };

            await _context.ChatParticipants.AddRangeAsync(participants);
            await _context.SaveChangesAsync();
        }

        [Fact]
        public async Task OnConnectedAsync_JoinsUserToTheirChatGroups()
        {
            // Act
            await _hub.OnConnectedAsync();

            // Assert
            _mockGroups.Verify(
                groups => groups.AddToGroupAsync(
                    _testConnectionId,
                    "1",
                    It.IsAny<CancellationToken>()
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task OnDisconnectedAsync_RemovesUserFromTheirChatGroups()
        {
            // Act
            await _hub.OnDisconnectedAsync(null);

            // Assert
            _mockGroups.Verify(
                groups => groups.RemoveFromGroupAsync(
                    _testConnectionId,
                    "1",
                    It.IsAny<CancellationToken>()
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task SendMessage_ValidChat_MessageSentToGroup()
        {
            // Arrange
            _mockClients
                .Setup(clients => clients.Group(It.IsAny<string>()))
                .Returns(_mockClientProxy.Object);

            // Act
            await _hub.SendMessage(1, "Test message");

            // Assert
            _mockClientProxy.Verify(
                clientProxy => clientProxy.SendCoreAsync(
                    "ReceiveMessage",
                    It.Is<object[]>(objects => objects.Length == 1 &&
                        objects[0] is Message &&
                        ((Message)objects[0]).Content == "Test message" &&
                        ((Message)objects[0]).SenderId == _testUserId),
                    It.IsAny<CancellationToken>()
                ),
                Times.Once
            );

            // Verify message was saved to database
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.ChatId == 1 && m.Content == "Test message");
            Assert.NotNull(message);
            Assert.Equal(_testUserId, message.SenderId);
        }

        [Fact]
        public async Task SendMessage_NonParticipant_ThrowsHubException()
        {
            // Arrange
            var nonParticipantChat = new Chat
            {
                Id = 2,
                Name = "Other Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Chats.AddAsync(nonParticipantChat);
            await _context.SaveChangesAsync();

            // Act & Assert
            var exception = await Assert.ThrowsAsync<HubException>(
                () => _hub.SendMessage(2, "Test message")
            );
            Assert.Equal("User is not a participant in this chat", exception.Message);
        }

        [Fact]
        public async Task MarkAsRead_ValidMessage_NotifiesGroup()
        {
            // Arrange
            _mockClients
                .Setup(clients => clients.Group(It.IsAny<string>()))
                .Returns(_mockClientProxy.Object);

            var message = new Message
            {
                Id = "test-message-id",
                ChatId = 1,
                SenderId = "other-user-id",
                Content = "Test message",
                SentAt = DateTime.UtcNow
            };
            await _context.Messages.AddAsync(message);
            await _context.SaveChangesAsync();

            // Act
            await _hub.MarkAsRead("test-message-id");

            // Assert
            _mockClientProxy.Verify(
                clientProxy => clientProxy.SendCoreAsync(
                    "MessageRead",
                    It.Is<object[]>(objects => objects.Length == 1 &&
                        objects[0] is MessageRead &&
                        ((MessageRead)objects[0]).MessageId == "test-message-id" &&
                        ((MessageRead)objects[0]).UserId == _testUserId),
                    It.IsAny<CancellationToken>()
                ),
                Times.Once
            );

            // Verify read receipt was saved to database
            var readReceipt = await _context.MessageReads
                .FirstOrDefaultAsync(r => r.MessageId == "test-message-id" && r.UserId == _testUserId);
            Assert.NotNull(readReceipt);
        }

        [Fact]
        public async Task JoinChat_ValidParticipant_AddsToGroup()
        {
            // Act
            await _hub.JoinChat(1);

            // Assert
            _mockGroups.Verify(
                groups => groups.AddToGroupAsync(
                    _testConnectionId,
                    "1",
                    It.IsAny<CancellationToken>()
                ),
                Times.Once
            );
        }

        [Fact]
        public async Task JoinChat_NonParticipant_ThrowsHubException()
        {
            // Arrange
            var nonParticipantChat = new Chat
            {
                Id = 2,
                Name = "Other Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Chats.AddAsync(nonParticipantChat);
            await _context.SaveChangesAsync();

            // Act & Assert
            var exception = await Assert.ThrowsAsync<HubException>(
                () => _hub.JoinChat(2)
            );
            Assert.Equal("User is not a participant in this chat", exception.Message);
        }

        [Fact]
        public async Task LeaveChat_RemovesFromGroup()
        {
            // Act
            await _hub.LeaveChat(1);

            // Assert
            _mockGroups.Verify(
                groups => groups.RemoveFromGroupAsync(
                    _testConnectionId,
                    "1",
                    It.IsAny<CancellationToken>()
                ),
                Times.Once
            );
        }
    }
}