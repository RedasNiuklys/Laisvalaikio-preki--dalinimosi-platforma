using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FriendshipController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FriendshipController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<object>>> GetFriends()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var friendships = await _context.Friendships
            .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == FriendshipStatus.Accepted)
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .Select(f => new
            {
                Friend = f.RequesterId == userId ? new
                {
                    f.Addressee.Id,
                    f.Addressee.Name,
                    f.Addressee.AvatarUrl,
                    f.Addressee.Email
                } : new
                {
                    f.Requester.Id,
                    f.Requester.Name,
                    f.Requester.AvatarUrl,
                    f.Requester.Email
                },
                f.CreatedAt
            })
            .ToListAsync();

        return Ok(friendships);
    }

    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<Friendship>>> GetPendingInvitations()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var pendingInvitations = await _context.Friendships
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .Select(f => new
            {
                f.Id,
                Requester = new
                {
                    f.Requester.Id,
                    f.Requester.Name,
                    f.Requester.AvatarUrl,
                    f.Requester.Email
                },
                f.CreatedAt
            })
            .ToListAsync();

        return Ok(pendingInvitations);
    }
    [HttpGet("pending/{id}")]
    public async Task<ActionResult<IEnumerable<object>>> GetPendingInvitationsByID([FromRoute] string id, [FromQuery] bool forCurrentUser)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(id))
        {
            return NotFound("Provided user was not found");
        }
        System.Console.WriteLine("forCurrentUser: " + forCurrentUser);
        if (!forCurrentUser)
        {
            var pendingInvitations = await _context.Friendships
                .Where(f => f.AddresseeId == id && f.Status == FriendshipStatus.Pending)
                .Include(f => f.Requester)
                .Select(f => new
                {
                    f.Id,
                    Requester = new
                    {
                        f.Requester.Id,
                        f.Requester.Name,
                        f.Requester.AvatarUrl,
                        f.Requester.Email
                    },
                    f.CreatedAt
                })
                .ToListAsync();

            return Ok(pendingInvitations);
        }
        else
        {
            var pendingInvitations = await _context.Friendships
                .Where(f => f.AddresseeId == id && f.Status == FriendshipStatus.Pending)
                .Where(f => f.RequesterId == userId)
                .Include(f => f.Requester)
                .Select(f => new
                {
                    f.Id,
                    Requester = new
                    {
                        f.Requester.Id,
                        f.Requester.Name,
                        f.Requester.AvatarUrl,
                        f.Requester.Email
                    },
                    f.CreatedAt
                })
                .ToListAsync();
            System.Console.WriteLine("pendingInvitations: " + pendingInvitations.Count);
            return Ok(pendingInvitations);

        }
    }

    [HttpPost("send")]
    public async Task<ActionResult> SendFriendRequest([FromBody] SendFriendRequestRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        // Check if friendship already exists
        var existingFriendship = await _context.Friendships
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == userId && f.AddresseeId == request.FriendId) ||
                (f.RequesterId == request.FriendId && f.AddresseeId == userId));

        if (existingFriendship != null)
        {
            return BadRequest("Friendship request already exists");
        }

        var friendship = new Friendship
        {
            RequesterId = userId,
            AddresseeId = request.FriendId,
            Status = FriendshipStatus.Pending
        };
        System.Console.WriteLine("Before add");

        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();
        System.Console.WriteLine("complete");
        return Ok(new { FriendshipId = friendship.Id });
    }

    [HttpPost("{friendshipId}/accept")]
    public async Task<ActionResult> AcceptFriendRequest(int friendshipId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId && f.AddresseeId == userId);

        if (friendship == null)
        {
            return NotFound("Friendship request not found");
        }

        if (friendship.Status != FriendshipStatus.Pending)
        {
            return BadRequest("Friendship request is not pending");
        }

        friendship.Status = FriendshipStatus.Accepted;
        friendship.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpPost("{friendshipId}/reject")]
    public async Task<ActionResult> RejectFriendRequest(int friendshipId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId && f.AddresseeId == userId);

        if (friendship == null)
        {
            return NotFound("Friendship request not found");
        }

        if (friendship.Status != FriendshipStatus.Pending)
        {
            return BadRequest("Friendship request is not pending");
        }

        friendship.Status = FriendshipStatus.Rejected;
        friendship.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpDelete("{friendshipId}")]
    public async Task<ActionResult> RemoveFriend(int friendshipId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId &&
                (f.RequesterId == userId || f.AddresseeId == userId));

        if (friendship == null)
        {
            return NotFound("Friendship not found");
        }

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();

        return Ok();
    }
}

public class SendFriendRequestRequest
{
    public string? FriendId { get; set; }
}