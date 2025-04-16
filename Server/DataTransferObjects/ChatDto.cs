using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Server.Models;

namespace Server.DataTransferObjects
{
    public class CreateChatDto
    {
        [Required]
        public ChatType Type { get; set; }

        [StringLength(100)]
        public string? Name { get; set; }  // Required for group chats

        [Required]
        [MinLength(1)]
        public List<string> MemberIds { get; set; }
    }

    public class SendMessageDto
    {
        [Required]
        [StringLength(2000)]
        public string Content { get; set; }

        [Required]
        public MessageType Type { get; set; } = MessageType.Text;

        public string? MediaUrl { get; set; }
    }

    public class ChatResponseDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public ChatType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<ChatMemberResponseDto> Members { get; set; }
        public MessageResponseDto LastMessage { get; set; }
        public int UnreadCount { get; set; }
    }

    public class ChatMemberResponseDto
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string UserAvatar { get; set; }
        public ChatMemberRole Role { get; set; }
        public DateTime JoinedAt { get; set; }
        public DateTime? LastSeen { get; set; }
        public bool IsActive { get; set; }
    }

    public class MessageResponseDto
    {
        public string Id { get; set; }
        public string ChatId { get; set; }
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string Content { get; set; }
        public string? MediaUrl { get; set; }
        public MessageType Type { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public bool IsDeleted { get; set; }
        public List<MessageReadResponseDto> ReadBy { get; set; }
    }

    public class MessageReadResponseDto
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public DateTime ReadAt { get; set; }
    }

    public class UpdateChatDto
    {
        [StringLength(100)]
        public string? Name { get; set; }
    }

    public class AddChatMembersDto
    {
        [Required]
        [MinLength(1)]
        public List<string> UserIds { get; set; }
    }
} 