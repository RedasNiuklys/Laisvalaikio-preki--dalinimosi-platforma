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

namespace Server.Tests.Controllers
{
    public class ChatControllerTests : TestBase
    {
        private readonly ChatController _controller;
        private readonly string _currentUserId = "current-user-id";
        private readonly string _otherUserId = "other-user-id";

        public ChatControllerTests() : base()
        {
            _controller = new ChatController(_context);

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
                Name = "Current User"
            };

            var otherUser = new ApplicationUser
            {
                Id = _otherUserId,
                UserName = "otheruser@example.com",
                Email = "otheruser@example.com",
                Name = "Other User"
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
                Name = "Current User"
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
                Name = "Other User"
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
                Name = "Current User"
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
    }
}