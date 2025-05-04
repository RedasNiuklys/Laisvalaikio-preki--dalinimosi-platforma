using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models;

public class MessageRead
{
    public string Id { get; set; }
    
    public string MessageId { get; set; }
    
    public string UserId { get; set; }
    
    public DateTime ReadAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("MessageId")]
    public virtual Message Message { get; set; }
    
    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; }
} 