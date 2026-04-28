using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Moq.Protected;
using Server.Controllers;
using Server.Models;
using Server.Services.Storage;
using System.Security.Claims;
using Xunit;

namespace Server.Tests.Controllers
{
    public class StorageControllerTests
    {
        private readonly StorageController _controller;
        private readonly Mock<IObjectStorageService> _objectStorageMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
        private readonly string _testUserId = "test-user-id";

        public StorageControllerTests()
        {
            _objectStorageMock = new Mock<IObjectStorageService>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                Mock.Of<IUserStore<ApplicationUser>>(),
                null, null, null, null, null, null, null, null);
            _httpClientFactoryMock = new Mock<IHttpClientFactory>();

            _controller = new StorageController(
                _objectStorageMock.Object,
                _userManagerMock.Object,
                _httpClientFactoryMock.Object);

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
            _controller.ControllerContext.HttpContext.Request.Scheme = "http";
            _controller.ControllerContext.HttpContext.Request.Host = new HostString("localhost", 5000);
        }

        [Fact]
        public async Task UploadAvatar_NoFileOrUri_ReturnsBadRequest()
        {
            var result = await _controller.UploadAvatar(null, null, _testUserId);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("No file or file URI provided", badRequestResult.Value);
        }

        [Fact]
        public async Task UploadAvatar_InvalidFileType_ReturnsBadRequest()
        {
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.txt");
            fileMock.Setup(f => f.Length).Returns(1024);

            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid file type. Allowed types: JPG, JPEG, PNG", badRequestResult.Value);
        }

        [Fact]
        public async Task UploadAvatar_ValidFile_ReturnsOk()
        {
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(1024);
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default)).Returns(Task.CompletedTask);

            var user = new ApplicationUser { Id = _testUserId };
            _userManagerMock.Setup(x => x.FindByIdAsync(_testUserId)).ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            _objectStorageMock.Verify(x => x.SaveAsync(It.IsAny<string>(), It.IsAny<Stream>(), It.IsAny<string>(), default), Times.Once);
        }

        [Fact]
        public async Task GetAvatar_InvalidPath_ReturnsBadRequest()
        {
            var result = await _controller.GetAvatar("../bad", "test.jpg");
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetAvatar_NotFound_ReturnsNotFound()
        {
            _objectStorageMock.Setup(x => x.OpenReadAsync(It.IsAny<string>(), default))
                .ReturnsAsync((StoredObject?)null);

            var result = await _controller.GetAvatar(_testUserId, "missing.jpg");
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetAvatar_Found_ReturnsFile()
        {
            _objectStorageMock.Setup(x => x.OpenReadAsync(It.IsAny<string>(), default))
                .ReturnsAsync(new StoredObject
                {
                    Stream = new MemoryStream(new byte[] { 1, 2, 3 }),
                    ContentType = "image/jpeg"
                });

            var result = await _controller.GetAvatar(_testUserId, "test.jpg");
            var fileResult = Assert.IsType<FileStreamResult>(result);
            Assert.Equal("image/jpeg", fileResult.ContentType);
        }

        [Fact]
        public async Task DeleteAvatar_NotFound_ReturnsNotFound()
        {
            _objectStorageMock.Setup(x => x.DeleteIfExistsAsync(It.IsAny<string>(), default)).ReturnsAsync(false);

            var result = await _controller.DeleteAvatar(_testUserId, "missing.jpg");
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteAvatar_Found_ReturnsOk()
        {
            _objectStorageMock.Setup(x => x.DeleteIfExistsAsync(It.IsAny<string>(), default)).ReturnsAsync(true);

            var result = await _controller.DeleteAvatar(_testUserId, "test.jpg");
            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task GetEquipmentImage_InvalidPath_ReturnsBadRequest()
        {
            var result = await _controller.GetEquipmentImage("../bad", "test.jpg");
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task DeleteEquipmentImage_Found_ReturnsOk()
        {
            _objectStorageMock.Setup(x => x.DeleteIfExistsAsync(It.IsAny<string>(), default)).ReturnsAsync(true);

            var result = await _controller.DeleteEquipmentImage("equipment-1", "test.jpg");
            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task GetEquipmentImage_Found_ReturnsFile()
        {
            _objectStorageMock.Setup(x => x.OpenReadAsync(It.IsAny<string>(), default))
                .ReturnsAsync(new StoredObject
                {
                    Stream = new MemoryStream(new byte[] { 1, 2, 3 }),
                    ContentType = "image/jpeg"
                });

            var result = await _controller.GetEquipmentImage("equipment-1", "test.jpg");
            var fileResult = Assert.IsType<FileStreamResult>(result);
            Assert.Equal("image/jpeg", fileResult.ContentType);
        }

        [Fact]
        public async Task GetEquipmentImage_NotFound_ReturnsNotFound()
        {
            _objectStorageMock.Setup(x => x.OpenReadAsync(It.IsAny<string>(), default))
                .ReturnsAsync((StoredObject?)null);

            var result = await _controller.GetEquipmentImage("equipment-1", "missing.jpg");
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteEquipmentImage_NotFound_ReturnsNotFound()
        {
            _objectStorageMock.Setup(x => x.DeleteIfExistsAsync(It.IsAny<string>(), default)).ReturnsAsync(false);

            var result = await _controller.DeleteEquipmentImage("equipment-1", "missing.jpg");
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task DeleteEquipmentImage_InvalidPath_ReturnsBadRequest()
        {
            var result = await _controller.DeleteEquipmentImage("../bad", "test.jpg");
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task DeleteAvatar_InvalidPath_ReturnsBadRequest()
        {
            var result = await _controller.DeleteAvatar("../bad", "test.jpg");
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task UploadAvatar_FileTooLarge_ReturnsBadRequest()
        {
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            fileMock.Setup(f => f.Length).Returns(200 * 1024 * 1024); // 200 MB

            var result = await _controller.UploadAvatar(fileMock.Object, null, _testUserId);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("File size exceeds the maximum allowed size of 100MB", badRequest.Value);
        }

        [Fact]
        public async Task UploadAvatar_WithFileUri_DownloadFails_ReturnsBadRequest()
        {
            var httpClientMock = new Mock<HttpMessageHandler>();
            var httpClient = new HttpClient(httpClientMock.Object);
            httpClientMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage(System.Net.HttpStatusCode.NotFound));

            _httpClientFactoryMock.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var result = await _controller.UploadAvatar(null, "http://example.com/file.jpg", _testUserId);
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Failed to download file from URI", badRequest.Value);
        }
    }
}
