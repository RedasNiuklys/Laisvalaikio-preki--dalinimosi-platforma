using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.DataTransferObjects;
using System.Security.Claims;

namespace Server.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private static readonly ConnectionMapping<string> _connections = new ConnectionMapping<string>();

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != null)
            {
                _connections.Add(userId, Context.ConnectionId);

                // Get all user's chats and join their SignalR groups
                var userChats = await _context.ChatMembers
                    .Where(cm => cm.UserId == userId && cm.IsActive)
                    .Select(cm => cm.ChatId)
                    .ToListAsync();

                foreach (var chatId in userChats)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
                }

                await Clients.Others.SendAsync("UserOnline", userId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId != null)
            {
                _connections.Remove(userId, Context.ConnectionId);

                // Only notify others if this was the user's last connection
                if (!_connections.GetConnections(userId).Any())
                {
                    await Clients.Others.SendAsync("UserOffline", userId);

                    // Update last seen
                    var userChats = await _context.ChatMembers
                        .Where(cm => cm.UserId == userId)
                        .ToListAsync();

                    foreach (var chatMember in userChats)
                    {
                        chatMember.LastSeen = DateTime.UtcNow;
                    }
                    await _context.SaveChangesAsync();
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(string chatId, SendMessageDto messageDto)
        {
            var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            // Verify user is member of the chat
            var chatMember = await _context.ChatMembers
                .FirstOrDefaultAsync(cm => cm.ChatId == chatId && cm.UserId == userId && cm.IsActive);

            if (chatMember == null)
            {
                throw new HubException("You are not a member of this chat");
            }

            var message = new Message
            {
                ChatId = chatId,
                SenderId = userId,
                Content = messageDto.Content,
                Type = messageDto.Type,
                MediaUrl = messageDto.MediaUrl
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Create response DTO
            var response = new MessageResponseDto
            {
                Id = message.Id,
                ChatId = message.ChatId,
                SenderId = message.SenderId,
                SenderName = (await _context.Users.FindAsync(userId))?.UserName ?? "Unknown",
                Content = message.Content,
                MediaUrl = message.MediaUrl,
                Type = message.Type,
                SentAt = message.SentAt,
                IsDeleted = message.IsDeleted,
                ReadBy = new List<MessageReadResponseDto>()
            };

            await Clients.Group(chatId).SendAsync("ReceiveMessage", response);
        }

        public async Task MarkMessageAsRead(string messageId)
        {
            var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var message = await _context.Messages
                .Include(m => m.ReadBy)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (message == null)
            {
                throw new HubException("Message not found");
            }

            if (!message.ReadBy.Any(r => r.UserId == userId))
            {
                var messageRead = new MessageRead
                {
                    MessageId = messageId,
                    UserId = userId
                };

                _context.MessageReads.Add(messageRead);
                await _context.SaveChangesAsync();

                var response = new MessageReadResponseDto
                {
                    UserId = userId,
                    UserName = (await _context.Users.FindAsync(userId))?.UserName ?? "Unknown",
                    ReadAt = messageRead.ReadAt
                };

                await Clients.Group(message.ChatId).SendAsync("MessageRead", messageId, response);
            }
        }

        public async Task StartTyping(string chatId)
        {
            var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            await Clients.Group(chatId).SendAsync("UserTyping", chatId, userId);
        }

        public async Task StopTyping(string chatId)
        {
            var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            await Clients.Group(chatId).SendAsync("UserStoppedTyping", chatId, userId);
        }
    }

    public class ConnectionMapping<T>
    {
        private readonly Dictionary<T, HashSet<string>> _connections = new Dictionary<T, HashSet<string>>();

        public int Count
        {
            get { return _connections.Count; }
        }

        public void Add(T key, string connectionId)
        {
            lock (_connections)
            {
                if (!_connections.TryGetValue(key, out HashSet<string> connections))
                {
                    connections = new HashSet<string>();
                    _connections.Add(key, connections);
                }
                connections.Add(connectionId);
            }
        }

        public void Remove(T key, string connectionId)
        {
            lock (_connections)
            {
                if (!_connections.TryGetValue(key, out HashSet<string> connections)) return;

                connections.Remove(connectionId);
                if (connections.Count == 0)
                {
                    _connections.Remove(key);
                }
            }
        }

        public IEnumerable<string> GetConnections(T key)
        {
            if (_connections.TryGetValue(key, out HashSet<string> connections))
            {
                return connections;
            }
            return Enumerable.Empty<string>();
        }
    }
} 