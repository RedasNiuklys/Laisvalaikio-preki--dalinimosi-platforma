using Google.Apis.Auth;

namespace Server.Services;

public sealed class GoogleIdTokenPayload
{
    public string Email { get; init; } = string.Empty;
    public string GivenName { get; init; } = string.Empty;
    public string FamilyName { get; init; } = string.Empty;
}

public interface IGoogleIdTokenValidator
{
    Task<GoogleIdTokenPayload> ValidateAsync(string idToken, string? audience);
}

public class GoogleIdTokenValidator : IGoogleIdTokenValidator
{
    public async Task<GoogleIdTokenPayload> ValidateAsync(string idToken, string? audience)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = string.IsNullOrWhiteSpace(audience) ? null : new[] { audience }
        };

        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        return new GoogleIdTokenPayload
        {
            Email = payload.Email,
            GivenName = payload.GivenName,
            FamilyName = payload.FamilyName
        };
    }
}
