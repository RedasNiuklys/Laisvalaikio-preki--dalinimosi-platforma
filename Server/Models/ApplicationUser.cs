using Microsoft.AspNetCore.Identity;

public class ApplicationUser : IdentityUser
{
    public string Name {get; set; }
    public string Theme { get; set; } = "Light";
}
