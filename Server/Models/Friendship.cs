using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models;

public class Friendship
{
    public int Id { get; set; }

    public string RequesterId { get; set; }
    public string AddresseeId { get; set; }

    public FriendshipStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("RequesterId")]
    public virtual ApplicationUser Requester { get; set; }

    [ForeignKey("AddresseeId")]
    public virtual ApplicationUser Addressee { get; set; }
}

public enum FriendshipStatus
{
    Pending,
    Accepted,
    Rejected,
    Blocked
}