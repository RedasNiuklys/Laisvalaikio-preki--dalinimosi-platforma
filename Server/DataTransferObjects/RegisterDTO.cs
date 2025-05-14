public class RegisterDto
{
    public string? FirstName { get; set; } = null;
    public string? LastName { get; set; } = null;
    public string? UserName { get; set; } = null;
    public string? Theme { get; set; } = "Light";
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
