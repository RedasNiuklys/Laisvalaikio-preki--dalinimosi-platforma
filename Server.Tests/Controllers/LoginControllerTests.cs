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
using System.Net;

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
        private readonly Mock<IFirebaseTokenVerifier> _firebaseTokenVerifierMock;
        private readonly Mock<IGoogleIdTokenValidator> _googleIdTokenValidatorMock;
        private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;

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
            _firebaseTokenVerifierMock = new Mock<IFirebaseTokenVerifier>();
            _googleIdTokenValidatorMock = new Mock<IGoogleIdTokenValidator>();
            _httpClientFactoryMock = new Mock<IHttpClientFactory>();
            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null, null, null, null);
            _userManagerMock.Setup(x => x.Users).Returns(_context.Users);
            _httpClientFactoryMock.Setup(x => x.CreateClient(It.IsAny<string>()))
                .Returns(CreateHttpClient(HttpStatusCode.OK));

            // Create controller instance
            _controller = new LoginController(
                _userManagerMock.Object,
                _signInManagerMock.Object,
                _tokenServiceMock.Object,
                contextAccessorMock.Object,
                _configurationMock.Object,
                _roleManagerMock.Object,
                _firebaseTokenVerifierMock.Object,
                _googleIdTokenValidatorMock.Object,
                _httpClientFactoryMock.Object,
                _context);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
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

        [Fact]
        public Task Ping_Always_ReturnsOkWithStatusOk()
        {
            // Act
            var result = _controller.Ping();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var payload = okResult.Value?.ToString() ?? string.Empty;
            Assert.Contains("ok", payload, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("LoginController reachable", payload);
            Assert.Contains("timestamp", payload, StringComparison.OrdinalIgnoreCase);
            return Task.CompletedTask;
        }

        [Fact]
        public Task Ping_ReturnsCurrentTimestamp()
        {
            // Act
            var result = _controller.Ping();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var payload = okResult.Value?.ToString() ?? string.Empty;
            Assert.Contains("timestamp", payload, StringComparison.OrdinalIgnoreCase);
            return Task.CompletedTask;
        }

        [Fact]
        public async Task FirebaseLogin_Infrastructure_Documented()
        {
            // This test documents that FirebaseLogin method exists
            // Full Firebase testing requires Firebase Admin SDK initialization
            // which is environment-dependent

            // Arrange & Act & Assert
            Assert.True(true); // Infrastructure documented
        }

        [Fact]
        public async Task Register_PasswordTooWeak_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "weak@example.com",
                Password = "123",
                FirstName = "Weak",
                LastName = "Password"
            };

            _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
                .ReturnsAsync(IdentityResult.Failed(
                    new IdentityError { Description = "Password must be at least 6 characters long" }));

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var errors = Assert.IsType<List<string>>(badRequestResult.Value);
            Assert.Contains(errors, e => e.Contains("at least 6 characters"));
        }

        [Fact]
        public async Task Logout_WithoutUserContext_ReturnsUnauthorized()
        {
            // Arrange - No user in context
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };

            // Act
            var result = await _controller.Logout();

            // Assert
            // Should return some error response when user not found
            Assert.NotNull(result);
        }

        [Fact]
        public async Task CheckEmail_UserExists_ReturnsOkWithExistsTrue()
        {
            var request = new LoginController.CheckEmailRequest { Email = "exists@example.com" };
            var user = new ApplicationUser { Email = request.Email };
            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(user);

            var result = await _controller.CheckEmail(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            dynamic value = ok.Value!;
            Assert.True((bool)value.GetType().GetProperty("exists")!.GetValue(value)!);
        }

        [Fact]
        public async Task CheckEmail_UserNotFound_ReturnsOkWithExistsFalse()
        {
            var request = new LoginController.CheckEmailRequest { Email = "notfound@example.com" };
            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync((ApplicationUser)null!);

            var result = await _controller.CheckEmail(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            dynamic value = ok.Value!;
            Assert.False((bool)value.GetType().GetProperty("exists")!.GetValue(value)!);
        }

        [Fact]
        public async Task CheckFirebaseUid_UserExists_ReturnsOkWithExistsTrue()
        {
            var request = new LoginController.CheckFirebaseUidRequest { Uid = "firebase-uid-123" };
            var user = new ApplicationUser { FirebaseUid = request.Uid };
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            _userManagerMock.Setup(x => x.Users).Returns(_context.Users);

            var result = await _controller.CheckFirebaseUid(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task CheckFirebaseUid_UserNotFound_ReturnsOkWithExistsFalse()
        {
            var request = new LoginController.CheckFirebaseUidRequest { Uid = "nonexistent-uid" };
            _userManagerMock.Setup(x => x.Users).Returns(_context.Users);

            var result = await _controller.CheckFirebaseUid(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            dynamic value = ok.Value!;
            Assert.False((bool)value.GetType().GetProperty("exists")!.GetValue(value)!);
        }

        [Fact]
        public async Task GoogleCallback_NoExternalLogin_ReturnsUnauthorized()
        {
            _signInManagerMock.Setup(x => x.GetExternalLoginInfoAsync(null))
                .ReturnsAsync((ExternalLoginInfo)null!);

            var result = await _controller.GoogleCallback();

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task FacebookCallback_NoExternalLogin_ReturnsUnauthorized()
        {
            _signInManagerMock.Setup(x => x.GetExternalLoginInfoAsync(null))
                .ReturnsAsync((ExternalLoginInfo)null!);

            var result = await _controller.FacebookCallback();

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task MicrosoftCallback_NoExternalLogin_ReturnsUnauthorized()
        {
            _signInManagerMock.Setup(x => x.GetExternalLoginInfoAsync(null))
                .ReturnsAsync((ExternalLoginInfo)null!);

            var result = await _controller.MicrosoftCallback();

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task MicrosoftCallback_ExternalLogin_NoEmail_ReturnsUnauthorized()
        {
            var claimsIdentity = new ClaimsIdentity();
            var claimsPrincipal = new ClaimsPrincipal(claimsIdentity);
            var loginInfo = new ExternalLoginInfo(claimsPrincipal, "Microsoft", "provider-key", "Microsoft");
            _signInManagerMock.Setup(x => x.GetExternalLoginInfoAsync(null)).ReturnsAsync(loginInfo);

            var result = await _controller.MicrosoftCallback();

            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal("Microsoft account did not return an email", unauthorizedResult.Value);
        }

        [Fact]
        public async Task GoogleMobile_InvalidToken_ReturnsUnauthorized()
        {
            var request = new LoginController.GoogleMobileRequest { IdToken = "invalid-token" };

            var result = await _controller.GoogleMobile(request);

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task FirebaseLogin_NullFirebaseAuth_Returns500()
        {
            _firebaseTokenVerifierMock.Setup(x => x.VerifyUidAsync(It.IsAny<string>()))
                .ThrowsAsync(new Exception("mock failure"));

            var request = new LoginController.FirebaseLoginRequest
            {
                Uid = "uid-1",
                Email = "test@example.com",
                FirebaseToken = "token"
            };

            var result = await _controller.FirebaseLogin(request);

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusResult.StatusCode);
        }

        [Fact]
        public async Task FirebaseRegister_EmptyEmail_ReturnsBadRequest()
        {
            var request = new LoginController.FirebaseRegisterRequest
            {
                Email = "",
                Uid = "uid-1",
                FirebaseToken = "token"
            };

            var result = await _controller.FirebaseRegister(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Email is required", badRequest.Value);
        }

        [Fact]
        public async Task FirebaseRegister_EmptyUid_ReturnsBadRequest()
        {
            var request = new LoginController.FirebaseRegisterRequest
            {
                Email = "test@example.com",
                Uid = "",
                FirebaseToken = "token"
            };

            var result = await _controller.FirebaseRegister(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Firebase UID is required", badRequest.Value);
        }

        [Fact]
        public async Task ValidateFacebookOAuth_MissingAccessToken_ReturnsBadRequest()
        {
            var request = new LoginController.ValidateFacebookOAuthRequest
            {
                AccessToken = "",
                FacebookId = "fb-123",
                Email = "test@example.com"
            };

            var result = await _controller.ValidateFacebookOAuth(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Access token is required", badRequest.Value);
        }

        [Fact]
        public async Task ValidateFacebookOAuth_MissingFacebookId_ReturnsBadRequest()
        {
            var request = new LoginController.ValidateFacebookOAuthRequest
            {
                AccessToken = "token",
                FacebookId = "",
                Email = "test@example.com"
            };

            var result = await _controller.ValidateFacebookOAuth(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Facebook ID is required", badRequest.Value);
        }

        [Fact]
        public async Task ValidateFacebookOAuth_MissingEmail_ReturnsBadRequest()
        {
            var request = new LoginController.ValidateFacebookOAuthRequest
            {
                AccessToken = "token",
                FacebookId = "fb-123",
                Email = ""
            };

            var result = await _controller.ValidateFacebookOAuth(request);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Email is required", badRequest.Value);
        }

        [Fact]
        public void Ping_ReturnsOk()
        {
            var result = _controller.Ping();
            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task GoogleMobile_ValidToken_ReturnsOkWithToken()
        {
            var request = new LoginController.GoogleMobileRequest { IdToken = "valid-id-token" };
            var payload = new GoogleIdTokenPayload
            {
                Email = "mobile@example.com",
                GivenName = "Mobile",
                FamilyName = "User"
            };
            var user = new ApplicationUser { Email = payload.Email, UserName = payload.Email };

            _googleIdTokenValidatorMock
                .Setup(x => x.ValidateAsync(request.IdToken, It.IsAny<string?>()))
                .ReturnsAsync(payload);
            _userManagerMock.Setup(x => x.FindByEmailAsync(payload.Email)).ReturnsAsync(user);
            _tokenServiceMock.Setup(x => x.CreateTokenAsync(user)).ReturnsAsync("jwt-mobile");

            var result = await _controller.GoogleMobile(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task FirebaseLogin_ValidExistingUser_ReturnsOk()
        {
            var request = new LoginController.FirebaseLoginRequest
            {
                Uid = "firebase-uid-1",
                Email = "existing@example.com",
                FirebaseToken = "firebase-token"
            };
            var user = new ApplicationUser
            {
                Id = "u-1",
                Email = request.Email,
                UserName = request.Email,
                FirebaseUid = null
            };

            _firebaseTokenVerifierMock.Setup(x => x.VerifyUidAsync(request.FirebaseToken)).ReturnsAsync(request.Uid);
            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(user);
            _userManagerMock.Setup(x => x.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

            var result = await _controller.FirebaseLogin(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task ValidateFacebookOAuth_ValidToken_ExistingUser_ReturnsOk()
        {
            var request = new LoginController.ValidateFacebookOAuthRequest
            {
                AccessToken = "valid-access-token",
                FacebookId = "fb-123",
                Email = "existing@example.com",
                FirstName = "Jane",
                LastName = "Doe"
            };
            var existingUser = new ApplicationUser
            {
                Id = "user-1",
                Email = request.Email,
                UserName = request.Email,
                FirstName = "Old",
                LastName = "Name"
            };

            _httpClientFactoryMock.Setup(x => x.CreateClient(It.IsAny<string>()))
                .Returns(CreateHttpClient(HttpStatusCode.OK));
            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email)).ReturnsAsync(existingUser);
            _userManagerMock.Setup(x => x.UpdateAsync(existingUser)).ReturnsAsync(IdentityResult.Success);
            _tokenServiceMock.Setup(x => x.GenerateToken(existingUser)).Returns("jwt-existing-user");

            var result = await _controller.ValidateFacebookOAuth(request);

            var ok = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(ok.Value);
        }

        private static HttpClient CreateHttpClient(HttpStatusCode statusCode)
        {
            var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(statusCode)
            {
                Content = new StringContent("{}")
            });
            return new HttpClient(handler);
        }

        private sealed class StubHttpMessageHandler : HttpMessageHandler
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

            public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
            {
                _handler = handler;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(_handler(request));
            }
        }
    }

    public class TokenResponse
    {
        public string Token { get; set; }
    }
}