using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;
using Server.Models;
using Server.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace Server.Tests.Services
{
    public class TokenServiceTests
    {
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly TokenService _tokenService;
        private readonly string _testUserId = "test-user-id";
        private readonly string _testEmail = "test@example.com";
        private readonly string _testJwtKey = "your-256-bit-secret-your-256-bit-secret"; // At least 32 characters
        private readonly string _testJwtIssuer = "test-issuer";
        private readonly string _testJwtAudience = "test-audience";

        public TokenServiceTests()
        {
            // Setup Configuration mock
            _configurationMock = new Mock<IConfiguration>();
            _configurationMock.Setup(x => x["Jwt:Key"]).Returns(_testJwtKey);
            _configurationMock.Setup(x => x["Jwt:Issuer"]).Returns(_testJwtIssuer);
            _configurationMock.Setup(x => x["Jwt:Audience"]).Returns(_testJwtAudience);

            // Setup UserManager mock
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            _tokenService = new TokenService(_configurationMock.Object, _userManagerMock.Object);
        }

        [Fact]
        public void GenerateToken_ValidUser_ReturnsValidToken()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = _testUserId,
                Email = _testEmail,
                UserName = _testEmail
            };

            // Act
            var token = _tokenService.GenerateToken(user);

            // Assert
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_testJwtKey)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            Assert.NotNull(validatedToken);
            Assert.IsType<JwtSecurityToken>(validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            Assert.Equal(_testUserId, jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Sub).Value);
            Assert.Equal(_testEmail, jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Email).Value);
            Assert.Contains(jwtToken.Claims, c => c.Type == "uid" && c.Value == _testUserId);
        }

        [Fact]
        public async Task CreateTokenAsync_ValidUser_ReturnsValidTokenWithRoles()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = _testUserId,
                Email = _testEmail,
                UserName = _testEmail
            };

            var userClaims = new List<Claim>
            {
                new Claim("custom_claim", "custom_value")
            };

            var userRoles = new List<string> { "Admin", "User" };

            _userManagerMock.Setup(x => x.GetClaimsAsync(user))
                .ReturnsAsync(userClaims);
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(userRoles);

            // Act
            var token = await _tokenService.CreateTokenAsync(user);

            // Assert
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_testJwtKey)),
                ValidateIssuer = true,
                ValidIssuer = _testJwtIssuer,
                ValidateAudience = true,
                ValidAudience = _testJwtAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            Assert.NotNull(validatedToken);
            Assert.IsType<JwtSecurityToken>(validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            Assert.Equal(_testUserId, jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Sub).Value);
            Assert.Equal(_testEmail, jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Email).Value);
            Assert.Contains(jwtToken.Claims, c => c.Type == "uid" && c.Value == _testUserId);
            Assert.Contains(jwtToken.Claims, c => c.Type == "custom_claim" && c.Value == "custom_value");
            Assert.Contains(jwtToken.Claims, c => c.Type == ClaimTypes.Role && c.Value == "Admin");
            Assert.Contains(jwtToken.Claims, c => c.Type == ClaimTypes.Role && c.Value == "User");
        }

        [Fact]
        public void GenerateToken_NullUser_ThrowsArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => _tokenService.GenerateToken(null));
        }

        [Fact]
        public async Task CreateTokenAsync_NullUser_ThrowsArgumentNullException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _tokenService.CreateTokenAsync(null));
        }

        [Fact]
        public void GenerateToken_ValidUser_TokenExpiresIn7Days()
        {
            // Arrange
            var user = new ApplicationUser
            {
                Id = _testUserId,
                Email = _testEmail,
                UserName = _testEmail
            };

            // Act
            var token = _tokenService.GenerateToken(user);

            // Assert
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            var expectedExpiration = DateTime.UtcNow.AddDays(7).Date;
            Assert.Equal(expectedExpiration, jwtToken.ValidTo.Date);
        }
    }
}