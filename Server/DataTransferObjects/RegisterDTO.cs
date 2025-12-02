public class RegisterDto
{
    public string? FirstName { get; set; } = null;
    public string? LastName { get; set; } = null;
    public string? UserName { get; set; } = null;
    public string? Theme { get; set; } = "Light";
    public required string Email { get; set; }
    public required string Password { get; set; }
}
