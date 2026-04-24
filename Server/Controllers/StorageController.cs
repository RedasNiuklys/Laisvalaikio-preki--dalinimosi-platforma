using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Identity;
using Server.Models;
using Server.Services.Storage;
using System.Text.RegularExpressions;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [EnableCors("CorsPolicy")]
    public class StorageController : ControllerBase
    {
        private readonly IObjectStorageService _objectStorage;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHttpClientFactory _httpClientFactory;
        private static readonly Regex SafePathSegmentRegex = new("^[a-zA-Z0-9._-]+$", RegexOptions.Compiled);

        public StorageController(
            IObjectStorageService objectStorage,
            UserManager<ApplicationUser> userManager,
            IHttpClientFactory httpClientFactory)
        {
            _objectStorage = objectStorage;
            _userManager = userManager;
            _httpClientFactory = httpClientFactory;
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
                    var httpClient = _httpClientFactory.CreateClient();
                    var response = await httpClient.GetAsync(fileUri);
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

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{extension}";
                var objectKey = StorageKeyHelper.Build("avatars", userId, fileName);

                await using var input = new MemoryStream(fileBytes);
                await _objectStorage.SaveAsync(objectKey, input, GetContentType(fileName));

                var relativeAvatarPath = $"api/Storage/GetAvatar/{userId}/{fileName}";
                var fullUrl = $"{Request.Scheme}://{Request.Host}/{relativeAvatarPath}";

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
        public async Task<IActionResult> GetAvatar(string userId, string fileName)
        {
            try
            {
                if (!IsSafePathSegment(userId) || !IsSafePathSegment(fileName))
                {
                    return BadRequest("Invalid path segment");
                }

                var objectKey = StorageKeyHelper.Build("avatars", userId, fileName);
                var storedObject = await _objectStorage.OpenReadAsync(objectKey);
                if (storedObject == null)
                    return NotFound("Avatar not found");

                return File(storedObject.Stream, storedObject.ContentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("DeleteAvatar/{userId}/{fileName}")]
        public async Task<IActionResult> DeleteAvatar(string userId, string fileName)
        {
            try
            {
                if (!IsSafePathSegment(userId) || !IsSafePathSegment(fileName))
                {
                    return BadRequest("Invalid path segment");
                }

                var objectKey = StorageKeyHelper.Build("avatars", userId, fileName);
                var deleted = await _objectStorage.DeleteIfExistsAsync(objectKey);
                if (!deleted)
                    return NotFound("Avatar not found");

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("GetEquipmentImage/{equipmentId}/{fileName}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetEquipmentImage(string equipmentId, string fileName)
        {
            try
            {
                if (!IsSafePathSegment(equipmentId) || !IsSafePathSegment(fileName))
                {
                    return BadRequest("Invalid path segment");
                }

                var objectKey = StorageKeyHelper.Build("equipment", equipmentId, fileName);
                var storedObject = await _objectStorage.OpenReadAsync(objectKey);
                if (storedObject == null)
                    return NotFound("Equipment image not found");

                return File(storedObject.Stream, storedObject.ContentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("DeleteEquipmentImage/{equipmentId}/{fileName}")]
        public async Task<IActionResult> DeleteEquipmentImage(string equipmentId, string fileName)
        {
            try
            {
                if (!IsSafePathSegment(equipmentId) || !IsSafePathSegment(fileName))
                {
                    return BadRequest("Invalid path segment");
                }

                var objectKey = StorageKeyHelper.Build("equipment", equipmentId, fileName);
                var deleted = await _objectStorage.DeleteIfExistsAsync(objectKey);
                if (!deleted)
                    return NotFound("Equipment image not found");

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private static bool IsSafePathSegment(string value)
        {
            return !string.IsNullOrWhiteSpace(value)
                && value == Path.GetFileName(value)
                && SafePathSegmentRegex.IsMatch(value);
        }

        private static string GetContentType(string fileName)
        {
            return Path.GetExtension(fileName).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
        }
    }
}