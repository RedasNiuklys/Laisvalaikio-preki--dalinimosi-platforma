using Microsoft.AspNetCore.Identity;

namespace Server.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string Theme { get; set; } = "Light";
        public string AvatarUrl { get; set; } = "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";
        public string? FirebaseUid { get; set; }
        public string? PushToken { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
