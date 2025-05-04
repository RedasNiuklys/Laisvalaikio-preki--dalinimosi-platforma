using System.ComponentModel.DataAnnotations;

namespace Server.Models;

public class Chat
{
    public int Id { get; set; }
    
    [MaxLength(100)]
    public string? Name { get; set; }  // Optional, used for group chats
    
    public bool IsGroupChat { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
} 