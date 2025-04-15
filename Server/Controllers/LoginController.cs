using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

[Route("api/[controller]")]
[ApiController]
public class LoginController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LoginController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        IHttpContextAccessor httpContextAccessor)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _httpContextAccessor = httpContextAccessor;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        Console.WriteLine("Registering user {0} {1} {2} {3} {4}", dto.Email, dto.UserName, dto.Name, dto.Theme, dto.Password);
        var user = new ApplicationUser 
        { 
            Email = dto.Email, 
            UserName = dto.UserName ?? dto.Email,
            Name = dto.Name ?? "John Doe",
            Theme = dto.Theme ?? "Light"
        };
        
        var result = await _userManager.CreateAsync(user, dto.Password);
        Console.WriteLine("User created: {0}", result.Succeeded);
        
        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"Error: {error.Code} - {error.Description}");
            }
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { errors });
        }

        var token = await _tokenService.CreateTokenAsync(user);
        return Ok(new { token });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Unauthorized("Invalid credentials");
        Console.WriteLine("User found: {0}", user.Email);
        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)  return Unauthorized("Invalid credentials");

        var token = await _tokenService.CreateTokenAsync(user);
        return Ok(new { token });
    }

    [HttpGet("google-login")]
    public IActionResult GoogleLogin()
    {
        var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", Url.Action(nameof(GoogleCallback)));
        return Challenge(properties, "Google");
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null) return Unauthorized("Error loading external login information");

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            user = new ApplicationUser 
            { 
                UserName = email,
                Email = email,
                Name = info.Principal.FindFirstValue(ClaimTypes.Name)
            };
            await _userManager.CreateAsync(user);
        }

        var token = await _tokenService.CreateTokenAsync(user);
        return Ok(new { token });
    }

    [HttpGet("facebook-login")]
    public IActionResult FacebookLogin()
    {
        var properties = _signInManager.ConfigureExternalAuthenticationProperties("Facebook", Url.Action(nameof(FacebookCallback)));
        return Challenge(properties, "Facebook");
    }

    [HttpGet("facebook-callback")]
    public async Task<IActionResult> FacebookCallback()
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null) return Unauthorized("Error loading external login information");

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            user = new ApplicationUser 
            { 
                UserName = email,
                Email = email,
                Name = info.Principal.FindFirstValue(ClaimTypes.Name)
            };
            await _userManager.CreateAsync(user);
        }

        var token = await _tokenService.CreateTokenAsync(user);
        return Ok(new { token });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        try
        {
            // Get the current user's ID from the token
            var userId = User.FindFirstValue("uid");
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
                return NotFound("User not found");

            // Get the current token
            var token = await _tokenService.CreateTokenAsync(user);
            
            // Sign out the user
            await _signInManager.SignOutAsync();
            
            return Ok(new { 
                message = "Logged out successfully",
                token = token // Return the token that was invalidated
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during logout", error = ex.Message });
        }
    }
}
