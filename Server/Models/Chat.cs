using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace Server.Models
{
    public enum ChatType
    {
        OneToOne,
        Group
    }

    public class Chat
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [StringLength(100)]
        public string Name { get; set; }  // Optional, used for group chats

        [Required]
        public ChatType Type { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<ChatMember> Members { get; set; } = new List<ChatMember>();
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    }
} 