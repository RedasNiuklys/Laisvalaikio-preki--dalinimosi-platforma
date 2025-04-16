using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;
using Server.Models;
using System.Security.Claims;

namespace Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Chat
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChatResponseDto>>> GetChats()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var chats = await _context.ChatMembers
                .Where(cm => cm.UserId == userId && cm.IsActive)
                .Include(cm => cm.Chat)
                    .ThenInclude(c => c.Members)
                        .ThenInclude(m => m.User)
                .Include(cm => cm.Chat)
                    .ThenInclude(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .Select(cm => new ChatResponseDto
                {
                    Id = cm.Chat.Id,
                    Name = cm.Chat.Name ?? GetChatName(cm.Chat, userId),
                    Type = cm.Chat.Type,
                    CreatedAt = cm.Chat.CreatedAt,
                    UpdatedAt = cm.Chat.UpdatedAt,
                    Members = cm.Chat.Members.Select(m => new ChatMemberResponseDto
                    {
                        Id = m.Id,
                        UserId = m.UserId,
                        UserName = m.User.UserName,
                        UserAvatar = m.User.Avatar,
                        Role = m.Role,
                        JoinedAt = m.JoinedAt,
                        LastSeen = m.LastSeen,
                        IsActive = m.IsActive
                    }).ToList(),
                    LastMessage = cm.Chat.Messages.Any() ? new MessageResponseDto
                    {
                        Id = cm.Chat.Messages.First().Id,
                        ChatId = cm.Chat.Messages.First().ChatId,
                        SenderId = cm.Chat.Messages.First().SenderId,
                        SenderName = cm.Chat.Messages.First().Sender.UserName,
                        Content = cm.Chat.Messages.First().Content,
                        MediaUrl = cm.Chat.Messages.First().MediaUrl,
                        Type = cm.Chat.Messages.First().Type,
                        SentAt = cm.Chat.Messages.First().SentAt,
                        EditedAt = cm.Chat.Messages.First().EditedAt,
                        IsDeleted = cm.Chat.Messages.First().IsDeleted
                    } : null,
                    UnreadCount = _context.Messages
                        .Count(m => m.ChatId == cm.Chat.Id && 
                                  m.SenderId != userId && 
                                  !m.ReadBy.Any(r => r.UserId == userId))
                })
                .ToListAsync();

            return chats;
        }

        // GET: api/Chat/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ChatResponseDto>> GetChat(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var chat = await _context.Chats
                .Include(c => c.Members)
                    .ThenInclude(m => m.User)
                .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (chat == null)
            {
                return NotFound();
            }

            if (!chat.Members.Any(m => m.UserId == userId && m.IsActive))
            {
                return Forbid();
            }

            return new ChatResponseDto
            {
                Id = chat.Id,
                Name = chat.Name ?? GetChatName(chat, userId),
                Type = chat.Type,
                CreatedAt = chat.CreatedAt,
                UpdatedAt = chat.UpdatedAt,
                Members = chat.Members.Select(m => new ChatMemberResponseDto
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    UserName = m.User.UserName,
                    UserAvatar = m.User.Avatar,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt,
                    LastSeen = m.LastSeen,
                    IsActive = m.IsActive
                }).ToList(),
                LastMessage = chat.Messages.Any() ? new MessageResponseDto
                {
                    Id = chat.Messages.First().Id,
                    ChatId = chat.Messages.First().ChatId,
                    SenderId = chat.Messages.First().SenderId,
                    SenderName = chat.Messages.First().Sender.UserName,
                    Content = chat.Messages.First().Content,
                    MediaUrl = chat.Messages.First().MediaUrl,
                    Type = chat.Messages.First().Type,
                    SentAt = chat.Messages.First().SentAt,
                    EditedAt = chat.Messages.First().EditedAt,
                    IsDeleted = chat.Messages.First().IsDeleted
                } : null,
                UnreadCount = _context.Messages
                    .Count(m => m.ChatId == chat.Id && 
                              m.SenderId != userId && 
                              !m.ReadBy.Any(r => r.UserId == userId))
            };
        }

        // GET: api/Chat/{id}/messages
        [HttpGet("{id}/messages")]
        public async Task<ActionResult<IEnumerable<MessageResponseDto>>> GetMessages(
            string id,
            [FromQuery] DateTime? before = null,
            [FromQuery] int limit = 50)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!await _context.ChatMembers.AnyAsync(cm => cm.ChatId == id && cm.UserId == userId && cm.IsActive))
            {
                return Forbid();
            }

            var query = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.ReadBy)
                    .ThenInclude(r => r.User)
                .Where(m => m.ChatId == id);

            if (before.HasValue)
            {
                query = query.Where(m => m.SentAt < before.Value);
            }

            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Take(limit)
                .Select(m => new MessageResponseDto
                {
                    Id = m.Id,
                    ChatId = m.ChatId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.UserName,
                    Content = m.Content,
                    MediaUrl = m.MediaUrl,
                    Type = m.Type,
                    SentAt = m.SentAt,
                    EditedAt = m.EditedAt,
                    IsDeleted = m.IsDeleted,
                    ReadBy = m.ReadBy.Select(r => new MessageReadResponseDto
                    {
                        UserId = r.UserId,
                        UserName = r.User.UserName,
                        ReadAt = r.ReadAt
                    }).ToList()
                })
                .ToListAsync();

            return messages;
        }

        // POST: api/Chat
        [HttpPost]
        public async Task<ActionResult<ChatResponseDto>> CreateChat(CreateChatDto createChatDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (createChatDto.Type == ChatType.Group && string.IsNullOrEmpty(createChatDto.Name))
            {
                return BadRequest("Group chats require a name");
            }

            // For one-to-one chats, check if chat already exists
            if (createChatDto.Type == ChatType.OneToOne)
            {
                if (createChatDto.MemberIds.Count != 1)
                {
                    return BadRequest("One-to-one chats must have exactly one other member");
                }

                var existingChat = await _context.Chats
                    .Include(c => c.Members)
                    .Where(c => c.Type == ChatType.OneToOne)
                    .FirstOrDefaultAsync(c => 
                        c.Members.Any(m => m.UserId == userId) && 
                        c.Members.Any(m => m.UserId == createChatDto.MemberIds[0]));

                if (existingChat != null)
                {
                    return CreatedAtAction(nameof(GetChat), new { id = existingChat.Id }, 
                        await GetChat(existingChat.Id));
                }
            }

            var chat = new Chat
            {
                Type = createChatDto.Type,
                Name = createChatDto.Name
            };

            // Add creator as admin
            chat.Members.Add(new ChatMember
            {
                UserId = userId,
                Role = ChatMemberRole.Admin
            });

            // Add other members
            foreach (var memberId in createChatDto.MemberIds)
            {
                chat.Members.Add(new ChatMember
                {
                    UserId = memberId,
                    Role = ChatMemberRole.Member
                });
            }

            _context.Chats.Add(chat);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetChat), new { id = chat.Id }, await GetChat(chat.Id));
        }

        // PUT: api/Chat/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateChat(string id, UpdateChatDto updateChatDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var chatMember = await _context.ChatMembers
                .FirstOrDefaultAsync(cm => cm.ChatId == id && cm.UserId == userId && cm.IsActive);

            if (chatMember == null)
            {
                return NotFound();
            }

            if (chatMember.Role != ChatMemberRole.Admin)
            {
                return Forbid();
            }

            var chat = await _context.Chats.FindAsync(id);
            if (chat == null)
            {
                return NotFound();
            }

            chat.Name = updateChatDto.Name;
            chat.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Chat/{id}/members
        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMembers(string id, AddChatMembersDto addMembersDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var chatMember = await _context.ChatMembers
                .Include(cm => cm.Chat)
                .FirstOrDefaultAsync(cm => cm.ChatId == id && cm.UserId == userId && cm.IsActive);

            if (chatMember == null)
            {
                return NotFound();
            }

            if (chatMember.Role != ChatMemberRole.Admin)
            {
                return Forbid();
            }

            if (chatMember.Chat.Type == ChatType.OneToOne)
            {
                return BadRequest("Cannot add members to one-to-one chats");
            }

            foreach (var memberId in addMembersDto.UserIds)
            {
                if (!await _context.ChatMembers.AnyAsync(cm => cm.ChatId == id && cm.UserId == memberId))
                {
                    _context.ChatMembers.Add(new ChatMember
                    {
                        ChatId = id,
                        UserId = memberId,
                        Role = ChatMemberRole.Member
                    });
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Chat/{id}/members/{userId}
        [HttpDelete("{id}/members/{userId}")]
        public async Task<IActionResult> RemoveMember(string id, string userId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var chatMember = await _context.ChatMembers
                .Include(cm => cm.Chat)
                .FirstOrDefaultAsync(cm => cm.ChatId == id && cm.UserId == currentUserId && cm.IsActive);

            if (chatMember == null)
            {
                return NotFound();
            }

            if (chatMember.Chat.Type == ChatType.OneToOne)
            {
                return BadRequest("Cannot remove members from one-to-one chats");
            }

            if (chatMember.Role != ChatMemberRole.Admin && currentUserId != userId)
            {
                return Forbid();
            }

            var memberToRemove = await _context.ChatMembers
                .FirstOrDefaultAsync(cm => cm.ChatId == id && cm.UserId == userId && cm.IsActive);

            if (memberToRemove == null)
            {
                return NotFound();
            }

            memberToRemove.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private string GetChatName(Chat chat, string currentUserId)
        {
            if (!string.IsNullOrEmpty(chat.Name))
                return chat.Name;

            if (chat.Type == ChatType.OneToOne)
            {
                var otherMember = chat.Members.FirstOrDefault(m => m.UserId != currentUserId);
                return otherMember?.User?.UserName ?? "Unknown User";
            }

            return "Group Chat";
        }
    }
} 