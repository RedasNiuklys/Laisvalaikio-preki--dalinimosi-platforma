using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using Server.Controllers;
using Server.DataTransferObjects;
using Server.Models;
using Server.Services;
using System.Security.Claims;
using Xunit;
using System.Linq;
using System.Collections.Generic;

namespace Server.Tests.Controllers
{
    public class LoginControllerTests : TestBase
    {
        private readonly LoginController _controller;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;

        public LoginControllerTests() : base()
        {
            // Setup UserManager mock
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            // Setup SignInManager mock
            var contextAccessorMock = new Mock<IHttpContextAccessor>();
            var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
            _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
                _userManagerMock.Object,
                contextAccessorMock.Object,
                claimsFactoryMock.Object,
                null, null, null, null);

            // Setup other mocks
            _tokenServiceMock = new Mock<ITokenService>();
            _configurationMock = new Mock<IConfiguration>();
            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null, null, null, null);

            // Create controller instance
            _controller = new LoginController(
                _userManagerMock.Object,
                _signInManagerMock.Object,
                _tokenServiceMock.Object,
                contextAccessorMock.Object,
                _configurationMock.Object,
                _roleManagerMock.Object);
        }

        [Fact]
        public async Task Register_ValidData_ReturnsOkWithToken()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "Test123!",
                FirstName = "Test",
                LastName = "User",
                Theme = "Light"
            };

            var expectedToken = "test-token";
            var createdUser = new ApplicationUser
            {
                Email = registerDto.Email,
                UserName = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Theme = registerDto.Theme
            };

            _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.Users)
                .Returns(_context.Users);
            _tokenServiceMock.Setup(x => x.CreateTokenAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(expectedToken);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<string>(okResult.Value);
            Assert.Equal(expectedToken, response);
        }

        [Fact]
        public async Task Register_InvalidData_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "weak"
            };

            _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password too weak" }));

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<List<string>>(badRequestResult.Value);
            Assert.Contains("Password too weak", response);
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsOkWithToken()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "Test123!"
            };

            var user = new ApplicationUser
            {
                Email = loginDto.Email,
                UserName = loginDto.Email
            };

            var expectedToken = "test-token";

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginDto.Email))
                .ReturnsAsync(user);
            _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, loginDto.Password, false))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
            _tokenServiceMock.Setup(x => x.CreateTokenAsync(user))
                .ReturnsAsync(expectedToken);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<string>(okResult.Value);
            Assert.Equal(expectedToken, response);
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "wrongpassword"
            };

            var user = new ApplicationUser
            {
                Email = loginDto.Email,
                UserName = loginDto.Email
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginDto.Email))
                .ReturnsAsync(user);
            _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, loginDto.Password, false))
                .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_UserNotFound_ReturnsUnauthorized()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "nonexistent@example.com",
                Password = "Test123!"
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginDto.Email))
                .ReturnsAsync((ApplicationUser)null);

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Register_FirstUser_MakesAdmin()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "admin@example.com",
                Password = "Admin123!",
                FirstName = "Admin",
                LastName = "User",
                Theme = "Light"
            };

            var createdUser = new ApplicationUser
            {
                Email = registerDto.Email,
                UserName = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Theme = registerDto.Theme
            };

            // Mock empty users list and count to trigger admin role creation
            var emptyUsersList = new List<ApplicationUser> { createdUser }.AsQueryable();
            _userManagerMock.Setup(x => x.Users)
                .Returns(emptyUsersList);

            _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Success)
                .Callback<ApplicationUser, string>((user, password) =>
                {
                    // Simulate user creation
                    user.Id = "test-user-id";
                });

            _roleManagerMock.Setup(x => x.RoleExistsAsync("Admin"))
                .ReturnsAsync(false);
            _roleManagerMock.Setup(x => x.CreateAsync(It.IsAny<IdentityRole>()))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Admin"))
                .ReturnsAsync(IdentityResult.Success);
            _tokenServiceMock.Setup(x => x.CreateTokenAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync("admin-token");

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<string>(okResult.Value);
            Assert.Equal("admin-token", response);

            _roleManagerMock.Verify(x => x.CreateAsync(It.Is<IdentityRole>(r => r.Name == "Admin")), Times.Once);
            _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Admin"), Times.Once);
        }

        [Fact]
        public async Task Logout_ValidUser_ReturnsOkWithNewToken()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser { Id = userId, Email = "test@example.com" };
            var expectedToken = "new-token";

            // Setup claims principal
            var claims = new List<Claim> { new Claim("uid", userId) };
            var identity = new ClaimsIdentity(claims);
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _tokenServiceMock.Setup(x => x.CreateTokenAsync(user))
                .ReturnsAsync(expectedToken);
            _signInManagerMock.Setup(x => x.SignOutAsync())
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Logout();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<LogoutResponseDto>(okResult.Value);
            Assert.Equal("Logged out successfully", response.Message);
            Assert.Equal(expectedToken, response.Token);
            _signInManagerMock.Verify(x => x.SignOutAsync(), Times.Once);
        }

        [Fact]
        public async Task Logout_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = "nonexistent-user-id";
            var claims = new List<Claim> { new Claim("uid", userId) };
            var identity = new ClaimsIdentity(claims);
            var claimsPrincipal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((ApplicationUser)null);

            // Act
            var result = await _controller.Logout();

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("User not found", notFoundResult.Value);
        }

        [Fact]
        public async Task AssignAdmin_ValidUser_ReturnsOk()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser { Id = userId, Email = "test@example.com" };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _roleManagerMock.Setup(x => x.RoleExistsAsync("Admin"))
                .ReturnsAsync(true);
            _userManagerMock.Setup(x => x.AddToRoleAsync(user, "Admin"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.AssignAdmin(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal($"User {userId} has been set as Admin", okResult.Value);
            _userManagerMock.Verify(x => x.AddToRoleAsync(user, "Admin"), Times.Once);
        }

        [Fact]
        public async Task AssignAdmin_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = "nonexistent-user-id";
            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((ApplicationUser)null);

            // Act
            var result = await _controller.AssignAdmin(userId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal($"User with ID {userId} not found", notFoundResult.Value);
        }

        [Fact]
        public async Task AssignAdmin_AdminRoleDoesNotExist_CreatesRoleAndAssignsUser()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser { Id = userId, Email = "test@example.com" };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _roleManagerMock.Setup(x => x.RoleExistsAsync("Admin"))
                .ReturnsAsync(false);
            _roleManagerMock.Setup(x => x.CreateAsync(It.IsAny<IdentityRole>()))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.AddToRoleAsync(user, "Admin"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.AssignAdmin(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal($"User {userId} has been set as Admin", okResult.Value);
            _roleManagerMock.Verify(x => x.CreateAsync(It.Is<IdentityRole>(r => r.Name == "Admin")), Times.Once);
            _userManagerMock.Verify(x => x.AddToRoleAsync(user, "Admin"), Times.Once);
        }

        [Fact]
        public async Task AssignAdmin_RoleAssignmentFails_ReturnsBadRequest()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser { Id = userId, Email = "test@example.com" };
            var errorMessage = "Failed to assign role";

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _roleManagerMock.Setup(x => x.RoleExistsAsync("Admin"))
                .ReturnsAsync(true);
            _userManagerMock.Setup(x => x.AddToRoleAsync(user, "Admin"))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = errorMessage }));

            // Act
            var result = await _controller.AssignAdmin(userId);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal($"Failed to assign admin role", badRequestResult.Value);
        }
    }

    public class TokenResponse
    {
        public string Token { get; set; }
    }
}