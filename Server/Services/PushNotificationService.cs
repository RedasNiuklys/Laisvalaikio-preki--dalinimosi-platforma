using System.Text;
using System.Text.Json;

namespace Server.Services;

public class PushNotificationService
{
    private readonly HttpClient _httpClient;
    private const string ExpoEndpoint = "https://exp.host/--/api/v2/push/send";

    public PushNotificationService(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task SendAsync(string pushToken, string title, string body, object? data = null)
    {
        if (string.IsNullOrWhiteSpace(pushToken)) return;

        var payload = new
        {
            to = pushToken,
            title,
            body,
            data = data ?? new { },
            sound = "default"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            await _httpClient.PostAsync(ExpoEndpoint, content);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Push notification failed: {ex.Message}");
        }
    }
}
