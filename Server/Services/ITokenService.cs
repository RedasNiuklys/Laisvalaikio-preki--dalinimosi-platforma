using Microsoft.AspNetCore.Identity;

namespace Server.Services
{
    public interface ITokenService
    {
        string GenerateToken(ApplicationUser user);
        Task<string> CreateTokenAsync(ApplicationUser user);
    }
} 