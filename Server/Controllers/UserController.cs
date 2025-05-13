using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Server.Models;
using Microsoft.EntityFrameworkCore;
using Server.DataTransferObjects;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    // private readonly ILogger<UserController> // _logger;

    // public class UpdateUserDto
    // {
    //     public string Name { get; set; }
    //     public string Theme { get; set; }
    //     [EmailAddress]
    //     public string Email { get; set; }
    //     public string AvatarUrl { get; set; }
    // }

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
    // [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApplicationUser>>> GetAllUsers()
    {
        try
        {
            var users = await _userManager.Users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                UserName = u.UserName,
                Name = u.Name,
                Theme = u.Theme,
                AvatarUrl = GetFullAvatarUrl(u.AvatarUrl, _configuration)
            }).ToListAsync();

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
    public async Task<ActionResult<UserDto>> GetUser(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound($"User with ID {id} not found");

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                UserName = user.UserName,
                Name = user.Name,
                Theme = user.Theme,
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
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                UserName = user.UserName,
                Name = user.Name,
                AvatarUrl = GetFullAvatarUrl(user.AvatarUrl, _configuration),
                Theme = user.Theme,
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
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> UpdateUser(string id, UpdateUserDto updateDto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound(new ErrorResponseDto { Message = "User not found" });
        }

        if (!string.IsNullOrEmpty(updateDto.Email) && updateDto.Email != user.Email)
        {
            var token = await _userManager.GenerateChangeEmailTokenAsync(user, updateDto.Email);
            var result = await _userManager.ChangeEmailAsync(user, updateDto.Email, token);
            if (!result.Succeeded)
            {
                return BadRequest(new ErrorResponseDto { Message = "Failed to update email" });
            }
        }

        user.Name = updateDto.Name;
        user.Theme = updateDto.Theme;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new ErrorResponseDto { Message = "Failed to update user" });
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            UserName = user.UserName,
            Name = user.Name,
            Theme = user.Theme,
            AvatarUrl = user.AvatarUrl,
            Roles = roles.ToList()
        });
    }

    // PATCH: api/user/profile
    [Authorize]
    [HttpPatch("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateUserDto updateDto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

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
            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                UserName = user.UserName,
                Name = user.Name,
                Theme = user.Theme,
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

    [Authorize]
    [HttpPatch("{id}/theme-preference")]
    public async Task<ActionResult<UserDto>> UpdateUserThemePreference([FromRoute] string id, [FromBody] ThemePreferenceDto themeDto)
    {
        try
        {
            // Verify the user is updating their own theme
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId != id)
            {
                return Forbid();
            }

            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound($"User with ID {id} not found");

            if (string.IsNullOrEmpty(themeDto.ThemePreference))
                return BadRequest("Theme preference is required");

            System.Console.WriteLine($"Updating theme preference for user {id} to {themeDto.ThemePreference}");
            user.Theme = themeDto.ThemePreference;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                UserName = user.UserName,
                Name = user.Name,
                Theme = user.Theme,
                AvatarUrl = GetFullAvatarUrl(user.AvatarUrl, _configuration),
                Roles = roles
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
    public async Task<ActionResult<DeleteUserResponseDto>> DeleteUser(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
                return NotFound(new ErrorResponseDto { Message = $"User with ID {id} not found" });

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return BadRequest(new ErrorResponseDto { Message = "Failed to delete user" });

            return Ok(new DeleteUserResponseDto { Message = $"User {id} successfully deleted" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponseDto { Message = "Internal server error occurred while deleting user" });
        }
    }

    // DELETE: api/user/profile
    [Authorize]
    [HttpDelete("profile")]
    public async Task<ActionResult<DeleteUserResponseDto>> DeleteProfile()
    {
        try
        {
            var userId = User.FindFirstValue("uid");
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound(new ErrorResponseDto { Message = "User not found" });

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return BadRequest(new ErrorResponseDto { Message = "Failed to delete profile" });

            return Ok(new DeleteUserResponseDto { Message = "Account successfully deleted" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponseDto { Message = "Internal server error occurred while deleting profile" });
        }
    }

    // POST: api/user/{id}/admin
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/admin")]
    public async Task<ActionResult<AdminOperationResponseDto>> SetUserAsAdmin(string id)
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
                return NotFound(new ErrorResponseDto { Message = $"User with ID {id} not found" });

            // Check if user is already an admin
            if (await _userManager.IsInRoleAsync(user, "Admin"))
                return BadRequest(new ErrorResponseDto { Message = "User is already an Admin" });

            // Add user to Admin role
            var result = await _userManager.AddToRoleAsync(user, "Admin");

            if (!result.Succeeded)
                return BadRequest(new ErrorResponseDto { Message = "Failed to set user as Admin" });

            return Ok(new AdminOperationResponseDto { Message = $"User {id} has been set as Admin" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponseDto { Message = "Internal server error occurred while setting user as Admin" });
        }
    }

    // DELETE: api/user/{id}/admin
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/admin")]
    public async Task<ActionResult<AdminOperationResponseDto>> RemoveUserFromAdmin(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new ErrorResponseDto { Message = $"User with ID {id} not found" });

            // Check if user is an admin
            if (!await _userManager.IsInRoleAsync(user, "Admin"))
                return BadRequest(new ErrorResponseDto { Message = "User is not an Admin" });

            // Remove user from Admin role
            var result = await _userManager.RemoveFromRoleAsync(user, "Admin");

            if (!result.Succeeded)
                return BadRequest(new ErrorResponseDto { Message = "Failed to remove user from Admin role" });

            return Ok(new AdminOperationResponseDto { Message = $"User {id} has been removed from Admin role" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponseDto { Message = "Internal server error occurred while removing user from Admin role" });
        }
    }

    // GET: api/user/chat-users
    [Authorize]
    [HttpGet("chat-users")]
    public async Task<ActionResult<IEnumerable<UserSearchResultDto>>> GetUsersForChat()
    {
        try
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var users = new List<UserSearchResultDto>();
            users = await _userManager.Users
                .Where(u => u.Id != currentUserId)
                .Select(u => new UserSearchResultDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    UserName = u.UserName,
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
    public async Task<ActionResult<IEnumerable<UserSearchResultDto>>> SearchUsers([FromQuery] string searchQuery)
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
                .Select(u => new UserSearchResultDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    UserName = u.UserName,
                    Name = u.Name,
                    AvatarUrl = GetFullAvatarUrl(u.AvatarUrl, _configuration)
                })
                .ToArrayAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            // _logger.LogError(ex, "Error searching users with query: {SearchQuery}", searchQuery);
            return StatusCode(500, "Internal server error occurred while searching users");
        }
    }
}
