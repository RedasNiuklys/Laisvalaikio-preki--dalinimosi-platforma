using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Server.Hubs;
using Server.Models;

namespace Server.Services;

public class NotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly PushNotificationService _push;
    private readonly IHubContext<ChatHub> _hubContext;

    public NotificationService(
        ApplicationDbContext context,
        PushNotificationService push,
        IHubContext<ChatHub> hubContext)
    {
        _context = context;
        _push = push;
        _hubContext = hubContext;
    }

    public async Task CreateAndSendAsync(
        string userId,
        NotificationType type,
        string title,
        string body,
        object? payload = null)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return;

        var payloadJson = payload != null
            ? System.Text.Json.JsonSerializer.Serialize(payload)
            : null;

        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            Payload = payloadJson,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Send push notification if token is available
        if (!string.IsNullOrWhiteSpace(user.PushToken))
            await _push.SendAsync(user.PushToken, title, body, payload);

        // Notify connected clients about unread count change
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        try
        {
            await _hubContext.Clients.User(userId)
                .SendAsync("NotificationCountChanged", unreadCount);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"NotificationCountChanged signal failed: {ex.Message}");
        }
    }
}
