using Microsoft.AspNetCore.Mvc;
using Server.Controllers;
using Server.Tests.Controllers;
using Xunit;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Server.Models;
using Server.DataTransferObjects;
using Microsoft.AspNetCore.SignalR;
using Server.Hubs;
using Moq;

namespace Server.Tests.Controllers
{
    public class ChatControllerTests : TestBase
    {
        private readonly ChatController _controller;
        private readonly string _currentUserId = "current-user-id";
        private readonly string _otherUserId = "other-user-id";
        private readonly Mock<IHubContext<ChatHub>> _hubContextMock;

        public ChatControllerTests() : base()
        {
            _hubContextMock = new Mock<IHubContext<ChatHub>>();
            _hubContextMock.Setup(x => x.Clients).Returns(new Mock<IHubClients>().Object);
            _controller = new ChatController(_context, _hubContextMock.Object);

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
        }

        [Fact]
        public async Task GetUserChats_ReturnsUserChats()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Test Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };

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
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _currentUserId,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetUserChats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<ChatResponseDto>>(okResult.Value);
            Assert.Single(returnValue);
            var returnedChat = returnValue[0] as dynamic;
            Assert.Equal(chat.Id, returnedChat.Id);
            Assert.Equal(chat.Name, returnedChat.Name);
            Assert.Equal(chat.IsGroupChat, returnedChat.IsGroupChat);
        }

        [Fact]
        public async Task GetChat_ValidChatId_ReturnsChat()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Test Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };

            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                FirstName = "Current",
                LastName = "User"
            };

            await _context.Users.AddAsync(currentUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _currentUserId,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetChat(chat.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = okResult.Value as ChatResponseDto;
            Assert.Equal(chat.Id, returnValue.Id);
            Assert.Equal(chat.Name, returnValue.Name);
            Assert.Equal(chat.IsGroupChat, returnValue.IsGroupChat);
        }

        [Fact]
        public async Task GetChat_InvalidChatId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetChat(999);
            System.Console.WriteLine(result);
            // Assert
            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task CreateChat_ValidRequest_ReturnsCreatedChat()
        {
            // Arrange
            var otherUser = new ApplicationUser
            {
                Id = _otherUserId,
                UserName = "otheruser@example.com",
                Email = "otheruser@example.com",
                FirstName = "Other",
                LastName = "User"
            };

            await _context.Users.AddAsync(otherUser);
            await _context.SaveChangesAsync();

            var request = new CreateChatRequest
            {
                Name = "New Chat",
                IsGroupChat = false,
                ParticipantIds = new List<string> { _otherUserId }
            };

            // Act
            var result = await _controller.CreateChat(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = okResult.Value as dynamic;
            Assert.NotNull(returnValue);
            int chatId = returnValue;
            // Verify chat was created
            var chat = await _context.Chats
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == chatId);
            Assert.NotNull(chat);
            Assert.Equal(request.Name, chat.Name);
            Assert.Equal(request.IsGroupChat, chat.IsGroupChat);
            Assert.Equal(2, chat.Participants.Count); // Current user + other user
        }

        [Fact]
        public async Task GetMessages_ValidChatId_ReturnsMessages()
        {
            // Arrange
            var chat = new Chat
            {
                Id = 1,
                Name = "Test Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };

            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                FirstName = "Current",
                LastName = "User"
            };

            await _context.Users.AddAsync(currentUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _currentUserId,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();

            var message = new Message
            {
                Id = "1",
                ChatId = chat.Id,
                SenderId = _currentUserId,
                Content = "Test message",
                SentAt = DateTime.UtcNow
            };

            await _context.Messages.AddAsync(message);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetMessages(chat.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<MessageResponseDto>>(okResult.Value);
            Assert.Single(returnValue);
            var returnedMessage = returnValue[0] as dynamic;
            Assert.Equal(message.Id, returnedMessage.Id);
            Assert.Equal(message.Content, returnedMessage.Content);
        }

        [Fact]
        public async Task GetChatParticipants_ValidChatId_ReturnsParticipants()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Test Chat",
                IsGroupChat = true,
                CreatedAt = DateTime.UtcNow
            };

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
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participants = new List<ChatParticipant>
            {
                new ChatParticipant
                {
                    ChatId = chat.Id,
                    UserId = _currentUserId,
                    IsAdmin = true,
                    JoinedAt = DateTime.UtcNow
                },
                new ChatParticipant
                {
                    ChatId = chat.Id,
                    UserId = _otherUserId,
                    IsAdmin = false,
                    JoinedAt = DateTime.UtcNow
                }
            };

            await _context.ChatParticipants.AddRangeAsync(participants);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetChatParticipants(chat.Id);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value).ToList();
            Assert.Equal(2, returnValue.Count);
        }

        [Fact]
        public async Task GetChatParticipants_UnauthorizedUser_ReturnsForbid()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Test Chat",
                IsGroupChat = true,
                CreatedAt = DateTime.UtcNow
            };

            var otherUser = new ApplicationUser
            {
                Id = _otherUserId,
                UserName = "otheruser@example.com",
                Email = "otheruser@example.com",
                FirstName = "Other",
                LastName = "User"
            };

            await _context.Users.AddAsync(otherUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _otherUserId,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetChatParticipants(chat.Id);

            // Assert
            Assert.IsType<ForbidResult>(result.Result);
        }

        [Fact]
        public async Task UpdateParticipants_AddParticipants_Success()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Group Chat",
                IsGroupChat = true,
                CreatedAt = DateTime.UtcNow
            };

            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                FirstName = "Current",
                LastName = "User"
            };

            var newUser = new ApplicationUser
            {
                Id = "new-user-id",
                UserName = "newuser@example.com",
                Email = "newuser@example.com",
                FirstName = "New",
                LastName = "User"
            };

            await _context.Users.AddRangeAsync(currentUser, newUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var adminParticipant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _currentUserId,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(adminParticipant);
            await _context.SaveChangesAsync();

            var request = new Server.Controllers.UpdateParticipantsRequest
            {
                ParticipantsToAdd = new List<string> { "new-user-id" },
                ParticipantsToRemove = null
            };

            // Act
            var result = await _controller.UpdateParticipants(chat.Id, request);

            // Assert
            var okResult = Assert.IsType<OkResult>(result);

            // Verify participant was added
            var updatedChat = await _context.Chats
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == chat.Id);
            Assert.NotNull(updatedChat);
            Assert.Equal(2, updatedChat.Participants.Count);
            Assert.True(updatedChat.Participants.Any(p => p.UserId == "new-user-id"));
        }

        [Fact]
        public async Task UpdateParticipants_NonAdminUser_ReturnsForbid()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Group Chat",
                IsGroupChat = true,
                CreatedAt = DateTime.UtcNow
            };

            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                FirstName = "Current",
                LastName = "User"
            };

            await _context.Users.AddAsync(currentUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var nonAdminParticipant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _currentUserId,
                IsAdmin = false,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(nonAdminParticipant);
            await _context.SaveChangesAsync();

            var request = new Server.Controllers.UpdateParticipantsRequest
            {
                ParticipantsToAdd = new List<string> { _otherUserId },
                ParticipantsToRemove = null
            };

            // Act
            var result = await _controller.UpdateParticipants(chat.Id, request);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task DeleteChat_OneToOneChat_Success()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Direct Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };

            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                FirstName = "Current",
                LastName = "User"
            };

            await _context.Users.AddAsync(currentUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _currentUserId,
                IsAdmin = false,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteChat(chat.Id);

            // Assert
            var okResult = Assert.IsType<OkResult>(result);

            // Verify chat was deleted
            var deletedChat = await _context.Chats
                .FirstOrDefaultAsync(c => c.Id == chat.Id);
            Assert.Null(deletedChat);
        }

        [Fact]
        public async Task DeleteChat_OneToOneChatWithMessages_ReturnsBadRequest()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Direct Chat",
                IsGroupChat = false,
                CreatedAt = DateTime.UtcNow
            };

            var currentUser = new ApplicationUser
            {
                Id = _currentUserId,
                UserName = "currentuser@example.com",
                Email = "currentuser@example.com",
                FirstName = "Current",
                LastName = "User"
            };

            await _context.Users.AddAsync(currentUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _currentUserId,
                IsAdmin = false,
                JoinedAt = DateTime.UtcNow
            };

            var message = new Message
            {
                Id = "message-1",
                ChatId = chat.Id,
                SenderId = _currentUserId,
                Content = "Test message",
                SentAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(participant);
            await _context.Messages.AddAsync(message);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteChat(chat.Id);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Cannot delete a chat with messages", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task DeleteChat_UnauthorizedUser_ReturnsForbid()
        {
            // Arrange
            var chat = new Chat
            {
                Name = "Group Chat",
                IsGroupChat = true,
                CreatedAt = DateTime.UtcNow
            };

            var otherUser = new ApplicationUser
            {
                Id = _otherUserId,
                UserName = "otheruser@example.com",
                Email = "otheruser@example.com",
                FirstName = "Other",
                LastName = "User"
            };

            await _context.Users.AddAsync(otherUser);
            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            var participant = new ChatParticipant
            {
                ChatId = chat.Id,
                UserId = _otherUserId,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            };

            await _context.ChatParticipants.AddAsync(participant);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteChat(chat.Id);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }
    }
}