using System;
using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public enum ChatMemberRole
    {
        Member,
        Admin
    }

    public class ChatMember
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string UserId { get; set; }
        public virtual ApplicationUser User { get; set; }

        [Required]
        public string ChatId { get; set; }
        public virtual Chat Chat { get; set; }

        [Required]
        public ChatMemberRole Role { get; set; } = ChatMemberRole.Member;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastSeen { get; set; }
        public bool IsActive { get; set; } = true;
    }
} 