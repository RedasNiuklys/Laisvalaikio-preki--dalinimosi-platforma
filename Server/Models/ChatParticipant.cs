using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models;

public class ChatParticipant
{
    public int Id { get; set; }
    
    public string UserId { get; set; }
    
    public int ChatId { get; set; }
    
    public bool IsAdmin { get; set; }
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; }
    
    [ForeignKey("ChatId")]
    public virtual Chat Chat { get; set; }
} 