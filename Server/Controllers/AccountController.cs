using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Server.Models;
using Server.DTOs;

[Route("api/[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    public AccountController(UserManager<ApplicationUser> userManager,
                              SignInManager<ApplicationUser> signInManager,
                              IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var user = new ApplicationUser { UserName = dto.Email, Email = dto.Email, Name = dto.Name, Theme = dto.Theme };
        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(GenerateJwtToken(user));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Unauthorized("Invalid credentials");

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded) return Unauthorized("Invalid credentials");

        return Ok(GenerateJwtToken(user));
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.Now.AddDays(7);

        var token = new JwtSecurityToken(
            _configuration["Jwt:Issuer"],
            _configuration["Jwt:Audience"],
            claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    [HttpGet("signin-google")]
public async Task<IActionResult> GoogleLoginCallback()
{
    var authenticateResult = await HttpContext.AuthenticateAsync();

    if (!authenticateResult.Succeeded || authenticateResult?.Principal == null)
        return Unauthorized();

    var claims = authenticateResult.Principal.Claims;
    var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

    // Find or create local user in DB
    var user = await _userManager.FindByEmailAsync(email);
    if (user == null)
    {
        user = new ApplicationUser { UserName = email, Email = email };
        await _userManager.CreateAsync(user);
    }

    // Generate JWT
    var token = _tokenService.GenerateToken(user);

    return Ok(new { token });
}
[HttpGet("signin-facebook")]
public async Task<IActionResult> FacebookoginCallback()
{
    var authenticateResult = await HttpContext.AuthenticateAsync();

    if (!authenticateResult.Succeeded || authenticateResult?.Principal == null)
        return Unauthorized();

    var claims = authenticateResult.Principal.Claims;
    var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

    // Find or create local user in DB
    var user = await _userManager.FindByEmailAsync(email);
    if (user == null)
    {
        user = new ApplicationUser { UserName = email, Email = email };
        await _userManager.CreateAsync(user);
    }

    // Generate JWT
    var token = _tokenService.GenerateToken(user);

    return Ok(new { token });
}


}
