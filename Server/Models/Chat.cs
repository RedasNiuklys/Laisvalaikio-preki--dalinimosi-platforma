using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Server.Models;

public class Chat
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [MaxLength(100)]
    public string? Name { get; set; }  // Optional, used for group chats

    public bool IsGroupChat { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}