using Microsoft.AspNetCore.Identity;

namespace Server.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Name {get; set; }
        public string Theme { get; set; } = "Light";
        public string? Avatar { get; set; }
    }
}
