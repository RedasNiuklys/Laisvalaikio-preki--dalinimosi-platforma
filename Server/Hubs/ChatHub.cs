using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;
    // private readonly ILogger<ChatHub> _logger;

    public ChatHub(ApplicationDbContext context)
    {
        _context = context;
        // _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"User connected: {userId}");

        if (!string.IsNullOrEmpty(userId))
        {
            // Get all chats the user is part of
            var userChats = await _context.ChatParticipants
                .Where(p => p.UserId.ToString() == userId)
                .Select(p => p.ChatId.ToString())
                .ToListAsync();

            Console.WriteLine($"Found {userChats.Count} chats for user {userId}");

            // Join all chat groups
            foreach (var chatId in userChats)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
                Console.WriteLine($"Joined chat group {chatId}");
            }
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            var userChats = await _context.ChatParticipants
                .Where(p => p.UserId == userId)
                .Select(p => p.ChatId.ToString())
                .ToListAsync();

            foreach (var chatId in userChats)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(int chatId, string content)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"Sending message to chat {chatId} from user {userId}");

        if (string.IsNullOrEmpty(userId))
        {
            throw new HubException("User not authenticated");
        }

        // Verify user is participant in chat
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(p => p.ChatId == chatId && p.UserId.ToString() == userId);

        if (!isParticipant)
        {
            Console.WriteLine($"User {userId} is not a participant in chat {chatId}");
            throw new HubException("User is not a participant in this chat");
        }

        // Get sender information
        var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
        if (sender == null)
        {
            Console.WriteLine($"Sender not found for user ID {userId}");
            throw new HubException("Sender not found");
        }

        // Create and save message
        var message = new Message
        {
            Id = Guid.NewGuid().ToString(),
            ChatId = chatId,
            SenderId = userId,
            Content = content,
            SentAt = DateTime.UtcNow,
            Sender = sender
        };
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        // Broadcast message to all participants
        await Clients.Group(chatId.ToString()).SendAsync("ReceiveMessage", new
        {
            Id = message.Id,
            Content = message.Content,
            SenderId = message.SenderId,
            ChatId = message.ChatId,
            SentAt = message.SentAt,
            Sender = new
            {
                Id = sender.Id,
                FirstName = sender.FirstName,
                LastName = sender.LastName,
                AvatarUrl = sender.AvatarUrl
            },
            ReadBy = new object[] { }
        });
    }

    public async Task MarkAsRead(string messageId)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            throw new HubException("User not authenticated");
        }

        var message = await _context.Messages
            .Include(m => m.Chat)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
        {
            throw new HubException("Message not found");
        }

        // Verify user is participant in chat
        var isParticipant = await _context.ChatParticipants
            .AnyAsync(p => p.ChatId == message.ChatId && p.UserId == userId);

        if (!isParticipant)
        {
            throw new HubException("User is not a participant in this chat");
        }

        // Check if already marked as read
        var existingRead = await _context.MessageReads
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId);

        if (existingRead == null)
        {
            var messageRead = new MessageRead
            {
                MessageId = messageId,
                UserId = userId,
                ReadAt = DateTime.UtcNow
            };

            _context.MessageReads.Add(messageRead);
            await _context.SaveChangesAsync();

            // Notify other participants
            await Clients.Group(message.ChatId.ToString()).SendAsync("MessageRead", new
            {
                MessageId = messageId,
                UserId = userId,
                ReadAt = messageRead.ReadAt
            });
        }
    }

    public async Task JoinChat(int chatId)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"Attempting to join chat {chatId} for user {userId}");

        if (string.IsNullOrEmpty(userId))
        {
            Console.WriteLine("User ID is null or empty");
            throw new HubException("User not authenticated");
        }

        // Get chat with participants
        var chat = await _context.Chats
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == chatId);

        if (chat == null)
        {
            Console.WriteLine($"Chat {chatId} not found");
            throw new HubException("Chat not found");
        }

        Console.WriteLine($"Found chat {chat.Id} with {chat.Participants.Count} participants");

        // Debug participant information
        foreach (var participant in chat.Participants)
        {
            Console.WriteLine($"Participant ID: {participant.UserId}, Type: {participant.UserId.GetType()}");
        }
        Console.WriteLine($"Current user ID: {userId}, Type: {userId.GetType()}");

        // Compare user IDs as strings
        var isParticipant = chat.Participants.Any(p => p.UserId.ToString() == userId);
        Console.WriteLine($"Is participant check result: {isParticipant}");

        if (!isParticipant)
        {
            Console.WriteLine($"User {userId} is not a participant in chat {chatId}");
            throw new HubException("User is not a participant in this chat");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, chatId.ToString());
        Console.WriteLine($"Successfully joined chat {chatId}");
    }

    public async Task LeaveChat(int chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId.ToString());
    }
}