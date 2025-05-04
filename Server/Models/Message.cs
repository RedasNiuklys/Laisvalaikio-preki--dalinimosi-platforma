using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models;

public class Message
{
    public string Id { get; set; }
    
    public int ChatId { get; set; }
    
    public string SenderId { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; }
    
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("ChatId")]
    public virtual Chat Chat { get; set; }
    
    [ForeignKey("SenderId")]
    public virtual ApplicationUser Sender { get; set; }
    
    public virtual ICollection<MessageRead> ReadReceipts { get; set; } = new List<MessageRead>();
} 