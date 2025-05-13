using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Server.Models;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    // private readonly ILogger<UserController> // _logger;

    public class UpdateUserDto
    {
        public string Name { get; set; }
        public string Theme { get; set; }
        [EmailAddress]
        public string Email { get; set; }
        public string AvatarUrl { get; set; }
    }

    public UserController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ILogger<UserController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        // _logger = logger;
    }

    private static string GetFullAvatarUrl(string relativeUrl, IConfiguration configuration)
    {
        if (string.IsNullOrEmpty(relativeUrl)) return null;
        if (relativeUrl.StartsWith("http")) return relativeUrl; // Already a full URL

        var localIP = configuration["AppSettings:LocalIP"];
        var apiPort = configuration["AppSettings:ApiPort"];
        return $"http://{localIP}:{apiPort}/{relativeUrl}";
    }

    private static string GetRelativeAvatarUrl(string fullUrl, IConfiguration configuration)
    {
        if (string.IsNullOrEmpty(fullUrl)) return null;

        var localIP = configuration["AppSettings:LocalIP"];
        var apiPort = configuration["AppSettings:ApiPort"];
        var baseUrl = $"http://{localIP}:{apiPort}/";

        return fullUrl.StartsWith(baseUrl)
            ? fullUrl.Substring(baseUrl.Length)
            : fullUrl;
    }

    // GET: api/user
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = _userManager.Users.Select(u => new
            {
                u.Id,
                u.Email,
                u.UserName,
                u.Name,
                u.Theme,
                AvatarUrl = GetFullAvatarUrl(u.AvatarUrl, _configuration)
            });

            return Ok(users);
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error retrieving all users");
            return StatusCode(500, "Internal server error occurred while retrieving users");
        }
    }

    // GET: api/user/{id}
    // [Authorize(Roles = "Admin")] // For development purposes
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(string id)
    {
        try
        {
            Console.WriteLine(id);
            var user = await _userManager.FindByIdAsync(id);
            Console.WriteLine(user);
            if (user == null)
                return NotFound($"User with ID {id} not found");

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Id,
                user.Email,
                user.UserName,
                user.Name,
                user.Theme,
                AvatarUrl = GetFullAvatarUrl(user.AvatarUrl, _configuration),
                Roles = roles
            });
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, "Internal server error occurred while retrieving user");
        }
    }

    // GET: api/user/profile
    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                user.Id,
                user.Email,
                user.UserName,
                user.Name,
                AvatarUrl = GetFullAvatarUrl(user.AvatarUrl, _configuration),
                user.Theme,
                Roles = roles
            });
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(500, "Internal server error occurred while retrieving profile");
        }
    }

    // PUT: api/user/{id}
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateUser([FromRoute] string id, [FromBody] UpdateUserDto updateDto)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound($"User with ID {id} not found");

            // Update user properties
            if (!string.IsNullOrEmpty(updateDto.Name))
                user.Name = updateDto.Name;

            if (!string.IsNullOrEmpty(updateDto.Theme))
                user.Theme = updateDto.Theme;

            if (!string.IsNullOrEmpty(updateDto.Email) && updateDto.Email != user.Email)
            {
                var emailToken = await _userManager.GenerateChangeEmailTokenAsync(user, updateDto.Email);
                var emailResult = await _userManager.ChangeEmailAsync(user, updateDto.Email, emailToken);

                if (!emailResult.Succeeded)
                    return BadRequest(emailResult.Errors);
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new
            {
                user.Id,
                user.Email,
                user.UserName,
                user.Name,
                user.Theme,
                AvatarUrl = GetFullAvatarUrl(user.AvatarUrl, _configuration),
                Roles = roles
            });
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, "Internal server error occurred while updating user");
        }
    }

    // PATCH: api/user/profile
    [Authorize]
    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto updateDto)
    {
        try
        {
            var userId = User.FindFirstValue("uid");
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

            // Update user properties
            if (!string.IsNullOrEmpty(updateDto.Name))
                user.Name = updateDto.Name;

            if (!string.IsNullOrEmpty(updateDto.Theme))
                user.Theme = updateDto.Theme;

            if (!string.IsNullOrEmpty(updateDto.AvatarUrl))
                user.AvatarUrl = GetRelativeAvatarUrl(updateDto.AvatarUrl, _configuration);

            if (!string.IsNullOrEmpty(updateDto.Email) && updateDto.Email != user.Email)
            {
                var emailToken = await _userManager.GenerateChangeEmailTokenAsync(user, updateDto.Email);
                var emailResult = await _userManager.ChangeEmailAsync(user, updateDto.Email, emailToken);

                if (!emailResult.Succeeded)
                    return BadRequest(emailResult.Errors);
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new
            {
                user.Id,
                user.Email,
                user.UserName,
                user.Name,
                user.Theme,
                AvatarUrl = GetFullAvatarUrl(user.AvatarUrl, _configuration),
                Roles = roles
            });
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error updating profile");
            return StatusCode(500, "Internal server error occurred while updating profile");
        }
    }
    [HttpPatch("{id}/theme-preference")]
    public async Task<IActionResult> UpdateUserThemePreference([FromRoute] string id, [FromBody] string themePreference)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound($"User with ID {id} not found");

            user.Theme = themePreference;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new
            {
                user.Id,
                user.Theme
            });
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error updating theme preference for user {UserId}", id);
            return StatusCode(500, "Internal server error occurred while updating theme preference");
        }
    }

    // DELETE: api/user/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound($"User with ID {id} not found");

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok($"User {id} successfully deleted");
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, "Internal server error occurred while deleting user");
        }
    }

    // DELETE: api/user/profile
    [Authorize]
    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteProfile()
    {
        try
        {
            var userId = User.FindFirstValue("uid");
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok("Account successfully deleted");
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error deleting profile");
            return StatusCode(500, "Internal server error occurred while deleting profile");
        }
    }

    // POST: api/user/{id}/admin
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/admin")]
    public async Task<IActionResult> SetUserAsAdmin(string id)
    {
        try
        {
            // Ensure Admin role exists
            if (!await _roleManager.RoleExistsAsync("Admin"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound($"User with ID {id} not found");

            // Check if user is already an admin
            if (await _userManager.IsInRoleAsync(user, "Admin"))
                return BadRequest("User is already an Admin");

            // Add user to Admin role
            var result = await _userManager.AddToRoleAsync(user, "Admin");

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok($"User {id} has been set as Admin");
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error setting user {UserId} as Admin", id);
            return StatusCode(500, "Internal server error occurred while setting user as Admin");
        }
    }

    // DELETE: api/user/{id}/admin
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/admin")]
    public async Task<IActionResult> RemoveUserFromAdmin(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound($"User with ID {id} not found");

            // Check if user is an admin
            if (!await _userManager.IsInRoleAsync(user, "Admin"))
                return BadRequest("User is not an Admin");

            // Remove user from Admin role
            var result = await _userManager.RemoveFromRoleAsync(user, "Admin");

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok($"User {id} has been removed from Admin role");
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error removing user {UserId} from Admin role", id);
            return StatusCode(500, "Internal server error occurred while removing user from Admin role");
        }
    }

    // GET: api/user/chat-users
    [Authorize]
    [HttpGet("chat-users")]
    public async Task<IActionResult> GetUsersForChat()
    {
        try
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var users = await _userManager.Users
                .Where(u => u.Id != currentUserId)
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    AvatarUrl = GetFullAvatarUrl(u.AvatarUrl, _configuration)
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error retrieving users for chat");
            return StatusCode(500, "Internal server error occurred while retrieving users");
        }
    }
    // GET: api/user/search
    [Authorize]
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string searchQuery)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(searchQuery))
            {
                return BadRequest("Search query cannot be empty");
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            searchQuery = searchQuery.ToLower().Trim();

            var users = await _userManager.Users
                .Where(u => u.Id != currentUserId && (
                    u.Email.ToLower().Contains(searchQuery) ||
                    u.UserName.ToLower().Contains(searchQuery) ||
                    u.Name.ToLower().Contains(searchQuery)
                ))
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.UserName,
                    u.Name,
                    AvatarUrl = GetFullAvatarUrl(u.AvatarUrl, _configuration)
                })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error searching users with query: {SearchQuery}", searchQuery);
            return StatusCode(500, "Internal server error occurred while searching users");
        }
    }
}
