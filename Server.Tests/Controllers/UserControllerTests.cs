using Microsoft.AspNetCore.Mvc;
using Server.Controllers;
using Server.Models;
using Server.DataTransferObjects;
using Xunit;
using Moq;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Collections.Generic;
using System.Linq;

namespace Server.Tests.Controllers
{
    public class UserControllerTests
    {
        private readonly UserController _controller;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<ILogger<UserController>> _loggerMock;

        public UserControllerTests()
        {
            // Setup mocks
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            var queryableUserStoreMock = userStoreMock.As<IQueryableUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                queryableUserStoreMock.Object, null, null, null, null, null, null, null, null);

            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null, null, null, null);

            _configurationMock = new Mock<IConfiguration>();
            _loggerMock = new Mock<ILogger<UserController>>();

            // Setup configuration
            _configurationMock.Setup(x => x["AppSettings:LocalIP"]).Returns("localhost");
            _configurationMock.Setup(x => x["AppSettings:ApiPort"]).Returns("5000");

            // Create controller instance
            _controller = new UserController(
                _userManagerMock.Object,
                _roleManagerMock.Object,
                _configurationMock.Object,
                _loggerMock.Object
            );

            // Setup authorization middleware
            var authServiceMock = new Mock<IAuthorizationService>();
            authServiceMock
                .Setup(x => x.AuthorizeAsync(
                    It.IsAny<ClaimsPrincipal>(),
                    It.IsAny<object>(),
                    It.IsAny<IEnumerable<IAuthorizationRequirement>>()))
                .ReturnsAsync(AuthorizationResult.Success());

            var authHandlerProviderMock = new Mock<IAuthorizationHandlerProvider>();
            var authHandlerContextFactoryMock = new Mock<IAuthorizationHandlerContextFactory>();
            var authEvaluatorMock = new Mock<IAuthorizationEvaluator>();
            var authPolicyProviderMock = new Mock<IAuthorizationPolicyProvider>();
            var authOptions = Options.Create(new AuthorizationOptions());
            var authLoggerMock = new Mock<ILogger<DefaultAuthorizationService>>();

            var authService = new DefaultAuthorizationService(
                authPolicyProviderMock.Object,
                authHandlerProviderMock.Object,
                authLoggerMock.Object,
                authHandlerContextFactoryMock.Object,
                authEvaluatorMock.Object,
                authOptions);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    RequestServices = new ServiceCollection()
                        .AddSingleton<IAuthorizationService>(authService)
                        .BuildServiceProvider()
                }
            };
        }

        [Fact]
        public async Task GetUser_ValidUserId_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User",
                Theme = "light"
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _controller.GetUser(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal(userId, returnValue.Id);
            Assert.Equal(user.Email, returnValue.Email);
            Assert.Equal(user.UserName, returnValue.UserName);
            Assert.Equal(user.FirstName, returnValue.FirstName);
            Assert.Equal(user.Theme, returnValue.Theme);
            Assert.Single(returnValue.Roles);
            Assert.Equal("User", returnValue.Roles[0]);
        }

        [Fact]
        public async Task GetUser_InvalidUserId_ReturnsNotFound()
        {
            // Arrange
            var userId = "non-existent-id";
            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((ApplicationUser)null);

            // Act
            var result = await _controller.GetUser(userId);

            // Assert
            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetProfile_ValidUser_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User",
                Theme = "light"
            };

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _controller.GetProfile();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal(userId, returnValue.Id);
            Assert.Equal(user.Email, returnValue.Email);
            Assert.Equal(user.UserName, returnValue.UserName);
            Assert.Equal(user.FirstName, returnValue.FirstName);
            Assert.Equal(user.LastName, returnValue.LastName);
            Assert.Equal(user.Theme, returnValue.Theme);
            Assert.Single(returnValue.Roles);
            Assert.Equal("User", returnValue.Roles[0]);
        }

        [Fact]
        public async Task UpdateUser_ValidData_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User",
                Theme = "light"
            };

            var updateDto = new UpdateUserDto
            {
                FirstName = "Updated",
                LastName = "Name",
                Email = "updated@example.com",
                Theme = "dark"
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.GenerateChangeEmailTokenAsync(user, updateDto.Email))
                .ReturnsAsync("email-token");
            _userManagerMock.Setup(x => x.ChangeEmailAsync(user, updateDto.Email, "email-token"))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _controller.UpdateUser(userId, updateDto);


            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal(updateDto.FirstName, returnValue.FirstName);
            Assert.Equal(updateDto.LastName, returnValue.LastName);
            // Assert.Equal(updateDto.Email, returnValue.Email);
            Assert.Equal(updateDto.Theme, returnValue.Theme);
            Assert.Single(returnValue.Roles);
            Assert.Equal("User", returnValue.Roles[0]);
        }

        /// <summary>
        /// Invalid due to EF Core issue with Mocking
        /// </summary>
        /// <returns></returns>
        // [Fact]
        // public async Task GetAllUsers_AdminUser_ReturnsAllUsers()
        // {
        //     // Arrange
        //     var users = new List<ApplicationUser>
        //     {
        //         new ApplicationUser { Id = "user1", UserName = "user1@example.com", Email = "user1@example.com", Name = "User 1", Theme = "light" },
        //         new ApplicationUser { Id = "user2", UserName = "user2@example.com", Email = "user2@example.com", Name = "User 2", Theme = "dark" }
        //     }.AsQueryable();

        //     var claims = new List<Claim>
        //     {
        //         new Claim(ClaimTypes.NameIdentifier, "admin-user"),
        //         new Claim(ClaimTypes.Role, "Admin")
        //     };
        //     var identity = new ClaimsIdentity(claims);
        //     var principal = new ClaimsPrincipal(identity);

        //     _controller.ControllerContext = new ControllerContext
        //     {
        //         HttpContext = new DefaultHttpContext { User = principal }
        //     };

        //     // Setup the mock to return the IQueryable directly
        //     _userManagerMock.Setup(x => x.Users)
        //         .Returns(users);

        //     // Act
        //     var result = await _controller.GetAllUsers();

        //     // Assert
        //     var okResult = Assert.IsType<OkObjectResult>(result.Result);
        //     var returnValue = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
        //     var userList = returnValue.ToList();
        //     Assert.Equal(2, userList.Count);
        //     Assert.Equal("user1@example.com", userList[0].Email);
        //     Assert.Equal("user2@example.com", userList[1].Email);
        //     Assert.Equal("light", userList[0].Theme);
        //     Assert.Equal("dark", userList[1].Theme);
        // }

        [Fact]
        public async Task UpdateProfile_ValidData_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User",
                Theme = "light"
            };

            var updateDto = new UpdateUserDto
            {
                FirstName = "Updated",
                LastName = "Name",
                Email = "updated@example.com",
                Theme = "dark"
            };

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.GenerateChangeEmailTokenAsync(user, updateDto.Email))
                .ReturnsAsync("email-token");
            _userManagerMock.Setup(x => x.ChangeEmailAsync(user, updateDto.Email, "email-token"))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _controller.UpdateProfile(updateDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal(updateDto.FirstName, returnValue.FirstName);
            Assert.Equal(updateDto.LastName, returnValue.LastName);
            Assert.Equal(updateDto.Theme, returnValue.Theme);
        }

        [Fact]
        public async Task UpdateUserThemePreference_ValidData_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User",
                Theme = "light"
            };

            // Setup user claims for authorization
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _controller.UpdateUserThemePreference(new ThemePreferenceDto { ThemePreference = "dark" });

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal("dark", returnValue.Theme);
        }

        [Fact]
        public async Task DeleteUser_ValidUser_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com"
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<DeleteUserResponseDto>(okResult.Value);
            Assert.Equal($"User {userId} successfully deleted", returnValue.Message);
        }

        [Fact]
        public async Task DeleteProfile_ValidUser_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com"
            };

            var claims = new List<Claim>
            {
                new Claim("uid", userId)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.DeleteProfile();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<DeleteUserResponseDto>(okResult.Value);
            Assert.Equal("Account successfully deleted", returnValue.Message);
        }

        [Fact]
        public async Task SetUserAsAdmin_ValidUser_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com"
            };

            _roleManagerMock.Setup(x => x.RoleExistsAsync("Admin"))
                .ReturnsAsync(true);
            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.IsInRoleAsync(user, "Admin"))
                .ReturnsAsync(false);
            _userManagerMock.Setup(x => x.AddToRoleAsync(user, "Admin"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.SetUserAsAdmin(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<AdminOperationResponseDto>(okResult.Value);
            Assert.Equal($"User {userId} has been set as Admin", returnValue.Message);
        }

        [Fact]
        public async Task RemoveUserFromAdmin_ValidUser_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var user = new ApplicationUser
            {
                Id = userId,
                UserName = "testuser@example.com",
                Email = "testuser@example.com"
            };

            _userManagerMock.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _userManagerMock.Setup(x => x.IsInRoleAsync(user, "Admin"))
                .ReturnsAsync(true);
            _userManagerMock.Setup(x => x.RemoveFromRoleAsync(user, "Admin"))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _controller.RemoveUserFromAdmin(userId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<AdminOperationResponseDto>(okResult.Value);
            Assert.Equal($"User {userId} has been removed from Admin role", returnValue.Message);
        }

        /// <summary>
        /// Invalid due to EF Core issue with Mocking List of Users
        /// </summary>
        /// <returns></returns>
        // [Fact]
        // public async Task GetUsersForChat_ReturnsUsersList()
        // {
        //     // Arrange
        //     var currentUserId = "current-user-id";
        //     var users = new List<ApplicationUser>
        //     {
        //         new ApplicationUser { Id = "user1", UserName = "user1@example.com", Name = "User 1" },
        //         new ApplicationUser { Id = "user2", UserName = "user2@example.com", Name = "User 2" }
        //     }.AsQueryable();

        //     var claims = new List<Claim>
        //     {
        //         new Claim(ClaimTypes.NameIdentifier, currentUserId)
        //     };
        //     var identity = new ClaimsIdentity(claims);
        //     var principal = new ClaimsPrincipal(identity);

        //     _controller.ControllerContext = new ControllerContext
        //     {
        //         HttpContext = new DefaultHttpContext { User = principal }
        //     };

        //     // Setup the mock to return the IQueryable
        //     _userManagerMock.Setup(x => x.Users)
        //         .Returns(users);

        //     // Act
        //     var result = await _controller.GetUsersForChat();

        //     // Debug output
        //     Debug.WriteLine($"Result type: {result.GetType()}");
        //     Debug.WriteLine($"Result.Result type: {result.Result?.GetType()}");
        //     Debug.WriteLine($"Result.Value type: {result.Value?.GetType()}");

        //     // Assert
        //     var okResult = Assert.IsType<OkObjectResult>(result.Result);
        //     var returnValue = Assert.IsAssignableFrom<IEnumerable<UserSearchResultDto>>(okResult.Value);
        //     var userList = returnValue.ToList();
        //     Assert.Equal(2, userList.Count);
        //     Assert.Equal("user1@example.com", userList[0].UserName);
        //     Assert.Equal("user2@example.com", userList[1].UserName);
        // }

        // [Fact]
        // public async Task SearchUsers_ValidQuery_ReturnsMatchingUsers()
        // {
        //     // Arrange
        //     var currentUserId = "current-user-id";
        //     var users = new List<ApplicationUser>
        //     {
        //         new ApplicationUser { Id = "user1", UserName = "user1@example.com", Name = "User 1" },
        //         new ApplicationUser { Id = "user2", UserName = "user2@example.com", Name = "User 2" }
        //     }.AsQueryable();

        //     var claims = new List<Claim>
        //     {
        //         new Claim(ClaimTypes.NameIdentifier, currentUserId)
        //     };
        //     var identity = new ClaimsIdentity(claims);
        //     var principal = new ClaimsPrincipal(identity);

        //     _controller.ControllerContext = new ControllerContext
        //     {
        //         HttpContext = new DefaultHttpContext { User = principal }
        //     };

        //     // Setup the mock to return the IQueryable
        //     _userManagerMock.Setup(x => x.Users)
        //         .Returns(users);

        //     // Act
        //     var result = await _controller.SearchUsers("user1");

        //     // Debug output
        //     Debug.WriteLine($"Result type: {result.GetType()}");
        //     Debug.WriteLine($"Result.Result type: {result.Result?.GetType()}");
        //     Debug.WriteLine($"Result.Value type: {result.Value?.GetType()}");

        //     // Assert
        //     var okResult = Assert.IsType<OkObjectResult>(result.Result);
        //     var returnValue = Assert.IsAssignableFrom<IEnumerable<UserSearchResultDto>>(okResult.Value);
        //     var userList = returnValue.ToList();
        //     Assert.Single(userList);
        //     Assert.Equal("user1@example.com", userList[0].UserName);
        // }
    }
}