using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace Server.Models
{
    public enum MessageType
    {
        Text,
        Image,
        File,
        SystemMessage
    }

    public class Message
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string ChatId { get; set; }
        public virtual Chat Chat { get; set; }

        [Required]
        public string SenderId { get; set; }
        public virtual ApplicationUser Sender { get; set; }

        [Required]
        [StringLength(2000)]
        public string Content { get; set; }

        public string? MediaUrl { get; set; }

        [Required]
        public MessageType Type { get; set; } = MessageType.Text;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public DateTime? EditedAt { get; set; }
        public bool IsDeleted { get; set; } = false;

        // Navigation properties
        public virtual ICollection<MessageRead> ReadBy { get; set; } = new List<MessageRead>();
    }

    public class MessageRead
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string MessageId { get; set; }
        public virtual Message Message { get; set; }

        [Required]
        public string UserId { get; set; }
        public virtual ApplicationUser User { get; set; }

        public DateTime ReadAt { get; set; } = DateTime.UtcNow;
    }
} 