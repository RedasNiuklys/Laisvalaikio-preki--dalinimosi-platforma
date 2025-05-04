using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    // private readonly ILogger<ChatController> _logger;

    public ChatController(ApplicationDbContext context)
    {
        _context = context;
        // _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetUserChats()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var chats = await _context.ChatParticipants
            .Where(p => p.UserId == userId)
            .Include(p => p.Chat)
                .ThenInclude(c => c.Participants)
                    .ThenInclude(p => p.User)
            .Include(p => p.Chat.Messages)
            .Select(p => new
            {
                p.Chat.Id,
                p.Chat.Name,
                p.Chat.IsGroupChat,
                p.Chat.CreatedAt,
                LastMessage = p.Chat.Messages
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => new
                    {
                        m.Id,
                        m.Content,
                        m.SentAt,
                        Sender = new
                        {
                            m.Sender.Id,
                            m.Sender.Name,
                            m.Sender.AvatarUrl
                        }
                    })
                    .FirstOrDefault(),
                Participants = p.Chat.Participants.Select(part => new
                {
                    part.User.Id,
                    part.User.Name,
                    part.User.AvatarUrl,
                    part.IsAdmin,
                    part.JoinedAt
                })
            })
            .ToListAsync();

        return Ok(chats);
    }

    [HttpGet("{chatId}")]
    public async Task<ActionResult<object>> GetChat(int chatId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var chat = await _context.Chats
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == chatId);

        if (chat == null)
        {
            return NotFound("Chat not found");
        }

        var isParticipant = chat.Participants.Any(p => p.UserId == userId);
        if (!isParticipant)
        {
            return Forbid();
        }

        return Ok(new
        {
            chat.Id,
            chat.Name,
            chat.IsGroupChat,
            chat.CreatedAt,
            Participants = chat.Participants.Select(p => new
            {
                p.User.Id,
                p.User.Name,
                p.User.AvatarUrl,
                p.IsAdmin,
                p.JoinedAt
            })
        });
    }

    [HttpGet("{chatId}/messages")]
    public async Task<ActionResult<IEnumerable<object>>> GetMessages(int chatId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var isParticipant = await _context.ChatParticipants
            .AnyAsync(p => p.ChatId == chatId && p.UserId == userId);

        if (!isParticipant)
        {
            return Forbid();
        }

        var messages = await _context.Messages
            .Where(m => m.ChatId == chatId)
            .OrderByDescending(m => m.SentAt)
            .Skip(skip)
            .Take(take)
            .Include(m => m.Sender)
            .Include(m => m.ReadReceipts)
                .ThenInclude(r => r.User)
            .Select(m => new
            {
                m.Id,
                m.Content,
                SentAt = m.SentAt.ToString("O"),
                Sender = new
                {
                    m.Sender.Id,
                    m.Sender.Name,
                    m.Sender.AvatarUrl
                },
                ReadBy = m.ReadReceipts.Select(r => new
                {
                    r.User.Id,
                    r.User.Name,
                    r.ReadAt
                })
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpPost("create")]
    public async Task<ActionResult<object>> CreateChat([FromBody] CreateChatRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // For 1-to-1 chat, check if chat already exists
        if (!request.IsGroupChat && request.ParticipantIds.Count == 1)
        {
            var existingChat = await _context.Chats
                .Include(c => c.Participants)
                .Where(c => !c.IsGroupChat)
                .FirstOrDefaultAsync(c =>
                    c.Participants.Any(p => p.UserId == userId) &&
                    c.Participants.Any(p => p.UserId == request.ParticipantIds[0]));

            if (existingChat != null)
            {
                return Ok(new { ChatId = existingChat.Id });
            }
        }

        // Create new chat
        var chat = new Chat
        {
            Name = request.Name,
            IsGroupChat = request.IsGroupChat,
            CreatedAt = DateTime.UtcNow
        };

        // Add creator as participant and admin
        var participants = new List<ChatParticipant>
        {
            new ChatParticipant
            {
                UserId = userId,
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            }
        };

        // Add other participants
        participants.AddRange(request.ParticipantIds.Select(id => new ChatParticipant
        {
            UserId = id,
            IsAdmin = false,
            JoinedAt = DateTime.UtcNow
        }));

        chat.Participants = participants;

        _context.Chats.Add(chat);
        await _context.SaveChangesAsync();

        return Ok(new { ChatId = chat.Id });
    }

    [HttpPut("{chatId}/participants")]
    public async Task<ActionResult> UpdateParticipants(int chatId, [FromBody] UpdateParticipantsRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var chat = await _context.Chats
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == chatId);

        if (chat == null)
        {
            return NotFound("Chat not found");
        }

        var userParticipant = chat.Participants.FirstOrDefault(p => p.UserId == userId);
        if (userParticipant == null || !userParticipant.IsAdmin)
        {
            return Forbid();
        }

        if (request.ParticipantsToAdd != null)
        {
            foreach (var participantId in request.ParticipantsToAdd)
            {
                if (!chat.Participants.Any(p => p.UserId == participantId))
                {
                    chat.Participants.Add(new ChatParticipant
                    {
                        UserId = participantId,
                        IsAdmin = false,
                        JoinedAt = DateTime.UtcNow
                    });
                }
            }
        }

        if (request.ParticipantsToRemove != null)
        {
            var participantsToRemove = chat.Participants
                .Where(p => request.ParticipantsToRemove.Contains(p.UserId))
                .ToList();

            foreach (var participant in participantsToRemove)
            {
                chat.Participants.Remove(participant);
            }
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}

public class CreateChatRequest
{
    public string? Name { get; set; }
    public bool IsGroupChat { get; set; }
    public List<string> ParticipantIds { get; set; } = new();
}

public class UpdateParticipantsRequest
{
    public List<string>? ParticipantsToAdd { get; set; }
    public List<string>? ParticipantsToRemove { get; set; }
} 