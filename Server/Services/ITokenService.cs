using Server.Models;

namespace Server.Services
{
    public interface ITokenService
    {
        Task<string> CreateTokenAsync(ApplicationUser user);
        string GenerateToken(ApplicationUser user);
    }
}
