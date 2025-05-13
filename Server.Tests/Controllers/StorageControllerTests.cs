using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Server.Controllers;
using Server.Models;
using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;
using Moq;

namespace Server.Tests.Controllers
{
    public class StorageControllerTests
    {
        private readonly StorageController _controller;
        private readonly Mock<IWebHostEnvironment> _environmentMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly string _testUserId = "test-user-id";
        private readonly string _testUploadPath;

        public StorageControllerTests()
        {
            // Setup mocks
            _environmentMock = new Mock<IWebHostEnvironment>();
            _configurationMock = new Mock<IConfiguration>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                Mock.Of<IUserStore<ApplicationUser>>(),
                null, null, null, null, null, null, null, null);

            // Setup configuration
            _configurationMock.Setup(x => x["AppSettings:LocalIP"]).Returns("localhost");
            _configurationMock.Setup(x => x["AppSettings:ApiPort"]).Returns("5000");

            // Setup environment
            _testUploadPath = Path.Combine(Path.GetTempPath(), "test-uploads");
            _environmentMock.Setup(x => x.WebRootPath).Returns(_testUploadPath);

            // Create controller
            _controller = new StorageController(
                _environmentMock.Object,
                _configurationMock.Object,
                _userManagerMock.Object);

            // Setup user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            // Create test directories
            Directory.CreateDirectory(Path.Combine(_testUploadPath, "uploads", "avatars", _testUserId));
        }

        [Fact]
        public async Task UploadAvatar_NoFileOrUri_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.UploadAvatar(null, null, _testUserId);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("No file or file URI provided", badRequestResult.Value);
        }

        [Fact]
        public async Task UploadAvatar_InvalidFileType_ReturnsBadRequest()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.txt");
            fileMock.Setup(f => f.Length).Returns(1024);

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid file type. Allowed types: JPG, JPEG, PNG", badRequestResult.Value);
        }

        [Fact]
        public async Task UploadAvatar_ValidFile_ReturnsOkWithUrl()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(1024);
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .Returns(Task.CompletedTask);

            var user = new ApplicationUser { Id = _testUserId };
            _userManagerMock.Setup(x => x.FindByIdAsync(_testUserId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<string>(okResult.Value);
            Assert.NotNull(returnValue);
            Assert.StartsWith("http://localhost:5000/api/Storage/GetAvatar/", returnValue);
        }

        [Fact]
        public async Task UploadAvatar_ValidUri_ReturnsOkWithUrl()
        {
            // Arrange
            var fileUri = "https://fastly.picsum.photos/id/817/200/300.jpg?hmac=Egrlh6ZzXMOSu9esbUDMY8PhK3cBCmeqHyWBXm7dnHQ";
            var user = new ApplicationUser { Id = _testUserId };
            _userManagerMock.Setup(x => x.FindByIdAsync(_testUserId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.UploadAvatar(null, fileUri, _testUserId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<string>(okResult.Value);
            Assert.NotNull(returnValue);
            Assert.StartsWith("http://localhost:5000/api/Storage/GetAvatar/", returnValue);
        }

        [Fact]
        public async Task UploadAvatar_FileSize100KB_ReturnsOk()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(100 * 1024); // 100KB
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .Returns(Task.CompletedTask);

            var user = new ApplicationUser { Id = _testUserId };
            _userManagerMock.Setup(x => x.FindByIdAsync(_testUserId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<string>(okResult.Value);
            Assert.NotNull(returnValue);
            Assert.StartsWith("http://localhost:5000/api/Storage/GetAvatar/", returnValue);
        }

        [Fact]
        public async Task UploadAvatar_FileSize1MB_ReturnsOk()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(1024 * 1024); // 1MB
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .Returns(Task.CompletedTask);

            var user = new ApplicationUser { Id = _testUserId };
            _userManagerMock.Setup(x => x.FindByIdAsync(_testUserId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<string>(okResult.Value);
            Assert.NotNull(returnValue);
            Assert.StartsWith("http://localhost:5000/api/Storage/GetAvatar/", returnValue);
        }

        [Fact]
        public async Task UploadAvatar_FileSize10MB_ReturnsOk()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(10 * 1024 * 1024); // 10MB
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .Returns(Task.CompletedTask);

            var user = new ApplicationUser { Id = _testUserId };
            _userManagerMock.Setup(x => x.FindByIdAsync(_testUserId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<string>(okResult.Value);
            Assert.NotNull(returnValue);
            Assert.StartsWith("http://localhost:5000/api/Storage/GetAvatar/", returnValue);
        }

        [Fact]
        public async Task UploadAvatar_FileSizeOver100MB_ReturnsBadRequest()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(101 * 1024 * 1024); // 101MB
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("File size exceeds the maximum allowed size of 100MB", badRequestResult.Value);
        }

        [Fact]
        public void GetAvatar_FileExists_ReturnsFile()
        {
            // Arrange
            var fileName = "test.jpg";
            var filePath = Path.Combine(_testUploadPath, "uploads", "avatars", _testUserId, fileName);
            File.WriteAllText(filePath, "test content");

            // Act
            var result = _controller.GetAvatar(_testUserId, fileName);

            // Assert
            var fileResult = Assert.IsType<FileStreamResult>(result);
            Assert.Equal("image/jpeg", fileResult.ContentType);
        }

        [Fact]
        public void GetAvatar_FileDoesNotExist_ReturnsNotFound()
        {
            // Act
            var result = _controller.GetAvatar(_testUserId, "nonexistent.jpg");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public void DeleteAvatar_FileExists_ReturnsOk()
        {
            // Arrange
            var fileName = "test.jpg";
            var filePath = Path.Combine(_testUploadPath, "uploads", "avatars", _testUserId, fileName);
            File.WriteAllText(filePath, "test content");

            // Act
            var result = _controller.DeleteAvatar(_testUserId, fileName);

            // Assert
            Assert.IsType<OkResult>(result);
            Assert.False(File.Exists(filePath));
        }

        [Fact]
        public void DeleteAvatar_FileDoesNotExist_ReturnsNotFound()
        {
            // Act
            var result = _controller.DeleteAvatar(_testUserId, "nonexistent.jpg");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        public void Dispose()
        {
            // Clean up test directories
            if (Directory.Exists(_testUploadPath))
            {
                Directory.Delete(_testUploadPath, true);
            }
        }
    }
}