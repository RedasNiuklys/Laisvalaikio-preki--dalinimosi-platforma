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
using Server.Models;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
public class LoginController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly FirebaseAuthService _firebaseAuth;

    public LoginController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration,
        RoleManager<IdentityRole> roleManager,
        FirebaseAuthService firebaseAuth)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _roleManager = roleManager;
        _firebaseAuth = firebaseAuth;
    }

    [HttpGet("ping")]
    [AllowAnonymous]
    public IActionResult Ping()
    {
        return Ok(new
        {
            status = "ok",
            message = "LoginController reachable",
            timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("firebase-login")]
    public async Task<IActionResult> FirebaseLogin([FromBody] FirebaseLoginRequest request)
    {
        try
        {
            Console.WriteLine("=== FIREBASE LOGIN ENDPOINT HIT ===");
            Console.WriteLine($"Firebase UID: {request.Uid}");
            Console.WriteLine($"Firebase Token: {request.FirebaseToken}");
            // Verify Firebase token
            var firebaseToken = await _firebaseAuth.VerifyTokenAsync(request.FirebaseToken);

            // Find or create user based on Firebase UID
            var user = await _userManager.FindByEmailAsync(request.Email);
            bool isNewUser = false;

            if (user == null)
            {
                // Create new user
                isNewUser = true;
                user = new ApplicationUser
                {
                    UserName = request.Email,
                    Email = request.Email,
                    EmailConfirmed = true, // Firebase already verified email
                    FirebaseUid = request.Uid
                };

                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                // Check if first user - make admin
                if (_userManager.Users.Count() == 1)
                {
                    if (!await _roleManager.RoleExistsAsync("Admin"))
                    {
                        await _roleManager.CreateAsync(new IdentityRole("Admin"));
                    }
                    await _userManager.AddToRoleAsync(user, "Admin");
                }
            }
            else
            {
                // Update Firebase UID if not set
                if (string.IsNullOrEmpty(user.FirebaseUid))
                {
                    user.FirebaseUid = request.Uid;
                    await _userManager.UpdateAsync(user);
                }
            }

            // Return user data with isNewUser flag for frontend
            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                userName = user.UserName,
                firstName = user.FirstName,
                lastName = user.LastName,
                theme = user.Theme,
                avatarUrl = user.AvatarUrl,
                isNewUser = isNewUser
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Firebase login error: {ex.Message}");
            return StatusCode(500, "Internal server error during Firebase login");
        }
    }

    [HttpPost("check-email")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckEmail([FromBody] CheckEmailRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            return Ok(new
            {
                exists = user != null,
                email = request.Email
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Check email error: {ex.Message}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("check-firebase-uid")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckFirebaseUid([FromBody] CheckFirebaseUidRequest request)
    {
        try
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.FirebaseUid == request.Uid);
            return Ok(new
            {
                exists = user != null,
                uid = request.Uid
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Check Firebase UID error: {ex.Message}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("firebase-register")]
    public async Task<IActionResult> FirebaseRegister([FromBody] FirebaseRegisterRequest request)
    {
        try
        {
            Console.WriteLine("=== FIREBASE REGISTER ENDPOINT HIT ===");
            Console.WriteLine($"Firebase UID: {request.Uid}");
            Console.WriteLine($"Email: {request.Email}");
            Console.WriteLine($"FirebaseToken present: {!string.IsNullOrEmpty(request.FirebaseToken)}");

            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                Console.WriteLine("Error: Email is required");
                return BadRequest("Email is required");
            }

            if (string.IsNullOrWhiteSpace(request.Uid))
            {
                Console.WriteLine("Error: Firebase UID is required");
                return BadRequest("Firebase UID is required");
            }

            // Verify Firebase token
            Console.WriteLine("Verifying Firebase token...");
            var firebaseToken = await _firebaseAuth.VerifyTokenAsync(request.FirebaseToken);
            Console.WriteLine($"Token verified successfully. UID from token: {firebaseToken.Uid}");

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                Console.WriteLine($"User already exists with email: {request.Email}. Linking Firebase UID.");
                // Update existing user with Firebase UID if not already set
                if (string.IsNullOrEmpty(existingUser.FirebaseUid))
                {
                    existingUser.FirebaseUid = request.Uid;
                    var updateResult = await _userManager.UpdateAsync(existingUser);
                    Console.WriteLine($"Updated User: {existingUser.Email}, Firebase UID: {existingUser.FirebaseUid}");
                    if (!updateResult.Succeeded)
                    {
                        var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                        Console.WriteLine($"Failed to update Firebase UID: {errors}");
                        return BadRequest($"Failed to link account: {errors}");
                    }
                    Console.WriteLine($"Successfully linked Firebase UID to existing user");
                }
                else
                {
                    Console.WriteLine($"User already has Firebase UID: {existingUser.FirebaseUid}");
                }
                // Return user data
                return Ok(new
                {
                    id = existingUser.Id,
                    email = existingUser.Email,
                    userName = existingUser.UserName,
                    firstName = existingUser.FirstName,
                    lastName = existingUser.LastName,
                    theme = existingUser.Theme,
                    avatarUrl = existingUser.AvatarUrl
                });
            }

            // Create new user
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName ?? "User",
                LastName = request.LastName ?? "",
                Theme = request.Theme ?? "light",
                AvatarUrl = request.AvatarUrl ?? "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
                EmailConfirmed = true, // Firebase already verified email
                FirebaseUid = request.Uid
            };

            Console.WriteLine($"Creating new user with email: {request.Email}");
            var result = await _userManager.CreateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"User creation failed: {errors}");
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            Console.WriteLine($"User created successfully: {user.Id}");

            // Check if first user - make admin
            if (_userManager.Users.Count() == 1)
            {
                if (!await _roleManager.RoleExistsAsync("Admin"))
                {
                    await _roleManager.CreateAsync(new IdentityRole("Admin"));
                }
                await _userManager.AddToRoleAsync(user, "Admin");
            }

            Console.WriteLine("Firebase register completed successfully");
            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                userName = user.UserName,
                firstName = user.FirstName,
                lastName = user.LastName,
                theme = user.Theme,
                avatarUrl = user.AvatarUrl
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"Unauthorized: {ex.Message}");
            return Unauthorized(ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Firebase register error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error during Firebase registration: {ex.Message}");
        }
    }

    [HttpPost("validate-facebook-oauth")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateFacebookOAuth([FromBody] ValidateFacebookOAuthRequest request)
    {
        try
        {
            Console.WriteLine("=== VALIDATE FACEBOOK OAUTH ENDPOINT HIT ===");
            Console.WriteLine($"Email: {request.Email}");
            Console.WriteLine($"Facebook UID: {request.FacebookId}");
            Console.WriteLine($"Access token present: {!string.IsNullOrEmpty(request.AccessToken)}");
            Console.WriteLine($"First Name: {request.FirstName}");
            Console.WriteLine($"Last Name: {request.LastName}");
            Console.WriteLine($"Theme: {request.Theme}");
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.AccessToken))
            {
                Console.WriteLine("Error: Access token is required");
                return BadRequest("Access token is required");
            }

            if (string.IsNullOrWhiteSpace(request.FacebookId))
            {
                Console.WriteLine("Error: Facebook ID is required");
                return BadRequest("Facebook ID is required");
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                Console.WriteLine("Error: Email is required");
                return BadRequest("Email is required");
            }

            // Validate access token with Facebook Graph API
            Console.WriteLine("Validating Facebook access token...");
            using (var client = new HttpClient())
            {
                var response = await client.GetAsync($"https://graph.facebook.com/me?access_token={request.AccessToken}");
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Facebook token validation failed");
                    return Unauthorized("Invalid Facebook access token");
                }
                Console.WriteLine("Facebook token validated successfully");
            }

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                Console.WriteLine($"User already exists with email: {request.Email}");
                // Update user with latest info
                existingUser.FirstName = request.FirstName ?? existingUser.FirstName;
                existingUser.LastName = request.LastName ?? existingUser.LastName;
                existingUser.AvatarUrl = request.AvatarUrl ?? existingUser.AvatarUrl;
                existingUser.Theme = request.Theme ?? existingUser.Theme;

                var updateResult = await _userManager.UpdateAsync(existingUser);
                if (!updateResult.Succeeded)
                {
                    var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                    Console.WriteLine($"Failed to update user: {errors}");
                    return BadRequest($"Failed to update user: {errors}");
                }

                // Generate backend JWT token
                var token = _tokenService.GenerateToken(existingUser);
                Console.WriteLine("Facebook OAuth login successful");
                return Ok(new
                {
                    id = existingUser.Id,
                    email = existingUser.Email,
                    userName = existingUser.UserName,
                    firstName = existingUser.FirstName,
                    lastName = existingUser.LastName,
                    theme = existingUser.Theme,
                    avatarUrl = existingUser.AvatarUrl,
                    token = token
                });
            }

            // Create new user
            var newUser = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName ?? "User",
                LastName = request.LastName ?? "",
                Theme = request.Theme ?? "light",
                AvatarUrl = request.AvatarUrl ?? "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
                EmailConfirmed = true // Facebook already verified
            };

            Console.WriteLine($"Creating new user with email: {request.Email}");
            var result = await _userManager.CreateAsync(newUser);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"User creation failed: {errors}");
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            Console.WriteLine($"User created successfully: {newUser.Id}");

            // Check if first user - make admin
            if (_userManager.Users.Count() == 1)
            {
                if (!await _roleManager.RoleExistsAsync("Admin"))
                {
                    await _roleManager.CreateAsync(new IdentityRole("Admin"));
                }
                await _userManager.AddToRoleAsync(newUser, "Admin");
            }

            // Generate backend JWT token
            var newUserToken = _tokenService.GenerateToken(newUser);
            Console.WriteLine("Facebook OAuth registration completed successfully");
            return Ok(new
            {
                id = newUser.Id,
                email = newUser.Email,
                userName = newUser.UserName,
                firstName = newUser.FirstName,
                lastName = newUser.LastName,
                theme = newUser.Theme,
                avatarUrl = newUser.AvatarUrl,
                token = newUserToken
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Facebook OAuth validation error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error during Facebook OAuth validation: {ex.Message}");
        }
    }

    // Keep existing endpoints for backwards compatibility
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        Console.WriteLine("=== REGISTER ENDPOINT HIT ===");
        Console.WriteLine($"Request from: {HttpContext.Connection.RemoteIpAddress}");
        Console.WriteLine("Registering user {0} {1} {2} {3} {4}", dto.Email, dto.UserName, dto.FirstName, dto.LastName, dto.Theme, dto.Password);
        var user = new ApplicationUser
        {
            Email = dto.Email,
            UserName = dto.UserName ?? dto.Email,
            FirstName = dto.FirstName ?? "John",
            LastName = dto.LastName ?? "Doe",
            Theme = dto.Theme ?? "Light",
        };
        Console.WriteLine("User: {0}", user.Email);
        Console.WriteLine("User: {0}", user.UserName);
        Console.WriteLine("User: {0}", user.FirstName);
        Console.WriteLine("User: {0}", user.LastName);
        Console.WriteLine("User: {0}", user.Theme);
        Console.WriteLine("User: {0}", user.AvatarUrl);
        var result = await _userManager.CreateAsync(user, dto.Password);
        Console.WriteLine("User created: {0}", result.Succeeded);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"Error: {error.Code} - {error.Description}");
            }
            List<string> errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(errors);
        }

        // Check if this is the first user and make them an admin
        Console.WriteLine("Checking if this is the first user");
        var isFirstUser = _userManager.Users.Count() == 1;
        Console.WriteLine("Is first user: {0}", isFirstUser);
        if (isFirstUser)
        {
            // Ensure Admin role exists
            if (!await _roleManager.RoleExistsAsync("Admin"))
            {
                Console.WriteLine("Admin role does not exist, creating it");
                await _roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            // Add user to Admin role
            await _userManager.AddToRoleAsync(user, "Admin");
            Console.WriteLine("User added to Admin role");
            Console.WriteLine("First user registered and set as Admin");
        }

        var token = await _tokenService.CreateTokenAsync(user);
        return Ok(token);
    }

    [HttpPost("loginUser")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        Console.WriteLine("=== LOGIN ENDPOINT HIT ===");
        Console.WriteLine($"Request from: {HttpContext.Connection.RemoteIpAddress}");
        Console.WriteLine($"Email: {dto.Email}");
        Console.WriteLine("Login started");
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Unauthorized("Invalid credentials");
        Console.WriteLine("User found: {0}", user.Email);
        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded) return Unauthorized("Invalid credentials");

        var token = await _tokenService.CreateTokenAsync(user);
        return Ok(token);
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
                FirstName = info.Principal.FindFirstValue(ClaimTypes.GivenName),
                LastName = info.Principal.FindFirstValue(ClaimTypes.Surname)
            };
            await _userManager.CreateAsync(user);
        }

        var token = await _tokenService.CreateTokenAsync(user);
        return Ok(new { token });
    }

    [HttpPost("google-mobile")]
    public async Task<IActionResult> GoogleMobile([FromBody] GoogleMobileRequest request)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new[] {
                    _configuration["Authentication:Google:ExpoClientId"]
                }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);

            var user = await _userManager.FindByEmailAsync(payload.Email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = payload.Email,
                    Email = payload.Email,
                    FirstName = payload.GivenName,
                    LastName = payload.FamilyName
                };
                await _userManager.CreateAsync(user);
            }

            var token = await _tokenService.CreateTokenAsync(user);
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            return Unauthorized("Invalid token");
        }
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
                FirstName = info.Principal.FindFirstValue(ClaimTypes.GivenName),
                LastName = info.Principal.FindFirstValue(ClaimTypes.Surname)
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
            var userId = User.FindFirstValue("uid");
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

            var token = await _tokenService.CreateTokenAsync(user);

            await _signInManager.SignOutAsync();

            return Ok(new LogoutResponseDto
            {
                Message = "Logged out successfully",
                Token = token
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during logout", error = ex.Message });
        }
    }

    [HttpPost("assign-admin/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignAdmin(string userId)
    {
        try
        {
            // Ensure Admin role exists
            if (!await _roleManager.RoleExistsAsync("Admin"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound($"User with ID {userId} not found");

            // Check if user is already an admin
            if (await _userManager.IsInRoleAsync(user, "Admin"))
                return BadRequest("User is already an Admin");

            // Add user to Admin role
            var result = await _userManager.AddToRoleAsync(user, "Admin");

            if (!result.Succeeded)
                return BadRequest("Failed to assign admin role");

            return Ok($"User {userId} has been set as Admin");
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Internal server error occurred while setting user as Admin");
        }
    }

    public class GoogleMobileRequest
    {
        public string IdToken { get; set; }
    }

    public class FirebaseLoginRequest
    {
        public string FirebaseToken { get; set; }
        public string Email { get; set; }
        public string Uid { get; set; }
    }

    public class FirebaseRegisterRequest
    {
        public string FirebaseToken { get; set; }
        public string Email { get; set; }
        public string Uid { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Theme { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class CheckEmailRequest
    {
        public string Email { get; set; }
    }

    public class CheckFirebaseUidRequest
    {
        public string Uid { get; set; }
    }

    public class ValidateFacebookOAuthRequest
    {
        public string AccessToken { get; set; }
        public string Email { get; set; }
        public string FacebookId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Theme { get; set; }
        public string? AvatarUrl { get; set; }
    }
}

public class LogoutResponseDto
{
    public string Message { get; set; }
    public string Token { get; set; }
}