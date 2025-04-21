using Microsoft.AspNetCore.Identity;
using Server.Models;
namespace Server.Services
{
    public interface ITokenService
    {
        string GenerateToken(ApplicationUser user);
        Task<string> CreateTokenAsync(ApplicationUser user);
    }
} 