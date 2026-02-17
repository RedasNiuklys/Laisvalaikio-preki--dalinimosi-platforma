using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Identity;
using Server.Models;
using System.Net.Http;
using System.Net.Http.Headers;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [EnableCors("CorsPolicy")]
    public class StorageController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly string _baseUploadPath;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly string _baseUrl;
        private readonly HttpClient _httpClient;

        public StorageController(
            IWebHostEnvironment environment,
            IConfiguration configuration,
            UserManager<ApplicationUser> userManager)
        {
            _environment = environment;
            _configuration = configuration;
            _userManager = userManager;
            _baseUploadPath = Path.Combine(_environment.WebRootPath, "uploads");
            _baseUrl = $"{_configuration["AppSettings:LocalIP"]}:{_configuration["AppSettings:ApiPort"]}";
            _httpClient = new HttpClient();

            // Ensure upload directory exists
            if (!Directory.Exists(_baseUploadPath))
            {
                Directory.CreateDirectory(_baseUploadPath);
            }
        }

        [HttpPost("UploadAvatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] IFormFile? file, [FromForm] string? fileUri, [FromForm] string userId)
        {
            Console.WriteLine("UploadAvatar");
            try
            {
                if (file == null && string.IsNullOrEmpty(fileUri))
                    return BadRequest("No file or file URI provided");

                byte[] fileBytes;
                string extension;

                if (file != null)
                {
                    // Handle web file upload
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                    extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (!allowedExtensions.Contains(extension))
                        return BadRequest("Invalid file type. Allowed types: JPG, JPEG, PNG");

                    // Check file size (100MB limit)
                    if (file.Length > 100 * 1024 * 1024)
                        return BadRequest("File size exceeds the maximum allowed size of 100MB");

                    using (var ms = new MemoryStream())
                    {
                        await file.CopyToAsync(ms);
                        fileBytes = ms.ToArray();
                    }
                }
                else
                {
                    // Handle Expo URI upload
                    var response = await _httpClient.GetAsync(fileUri);
                    if (!response.IsSuccessStatusCode)
                        return BadRequest("Failed to download file from URI");

                    fileBytes = await response.Content.ReadAsByteArrayAsync();

                    // Check file size for URI downloads (100MB limit)
                    if (fileBytes.Length > 100 * 1024 * 1024)
                        return BadRequest("File size exceeds the maximum allowed size of 100MB");

                    var contentType = response.Content.Headers.ContentType?.MediaType;

                    extension = contentType switch
                    {
                        "image/jpeg" => ".jpg",
                        "image/png" => ".png",
                        _ => throw new Exception("Unsupported file type")
                    };
                }

                // Create user-specific directory
                var userDirectory = Path.Combine(_baseUploadPath, "avatars", userId);
                Directory.CreateDirectory(userDirectory);

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(userDirectory, fileName);

                // Save file
                await System.IO.File.WriteAllBytesAsync(filePath, fileBytes);

                // Create full URL for the avatar
                var fullUrl = $"http://{_baseUrl}/api/Storage/GetAvatar/{userId}/{fileName}";

                // Update user's avatar URL
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    user.AvatarUrl = fullUrl;
                    await _userManager.UpdateAsync(user);
                }

                return Ok(new { avatarUrl = fullUrl });
                // return Ok(fullUrl);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("GetAvatar/{userId}/{fileName}")]
        [AllowAnonymous]
        public IActionResult GetAvatar(string userId, string fileName)
        {
            try
            {
                var filePath = Path.Combine(_baseUploadPath, "avatars", userId, fileName);

                if (!System.IO.File.Exists(filePath))
                    return NotFound("Avatar not found");

                var fileStream = System.IO.File.OpenRead(filePath);
                return File(fileStream, "image/jpeg");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("DeleteAvatar/{userId}/{fileName}")]
        public IActionResult DeleteAvatar(string userId, string fileName)
        {
            try
            {
                var filePath = Path.Combine(_baseUploadPath, "avatars", userId, fileName);

                if (!System.IO.File.Exists(filePath))
                    return NotFound("Avatar not found");

                System.IO.File.Delete(filePath);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}