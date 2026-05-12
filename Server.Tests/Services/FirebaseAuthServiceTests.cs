using FirebaseAdmin.Auth;
using Microsoft.Extensions.Logging;
using Moq;
using Server.Services;
using System.Runtime.CompilerServices;

namespace Server.Tests.Services
{
    public class FirebaseAuthServiceTests
    {
        private readonly Mock<IFirebaseAuthClient> _firebaseAuthClientMock;
        private readonly Mock<ILogger<FirebaseAuthService>> _loggerMock;
        private readonly FirebaseAuthService _service;

        public FirebaseAuthServiceTests()
        {
            _firebaseAuthClientMock = new Mock<IFirebaseAuthClient>();
            _loggerMock = new Mock<ILogger<FirebaseAuthService>>();
            _service = new FirebaseAuthService(_firebaseAuthClientMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task VerifyTokenAsync_ValidToken_ReturnsDecodedToken()
        {
            var decodedToken = CreateUninitialized<FirebaseToken>();
            _firebaseAuthClientMock.Setup(client => client.VerifyIdTokenAsync("valid-token"))
                .ReturnsAsync(decodedToken);

            var result = await _service.VerifyTokenAsync("valid-token");

            Assert.Same(decodedToken, result);
        }

        [Fact]
        public async Task VerifyTokenAsync_InvalidFirebaseToken_ThrowsUnauthorizedAccessException()
        {
            var firebaseException = CreateUninitialized<FirebaseAuthException>();
            _firebaseAuthClientMock.Setup(client => client.VerifyIdTokenAsync("invalid-token"))
                .ThrowsAsync(firebaseException);

            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.VerifyTokenAsync("invalid-token"));

            Assert.StartsWith("Invalid Firebase token:", exception.Message);
            Assert.Same(firebaseException, exception.InnerException);
        }

        [Fact]
        public async Task VerifyTokenAsync_NetworkError_LogsAndThrowsInvalidOperationException()
        {
            var httpException = new HttpRequestException("Network error");
            _firebaseAuthClientMock.Setup(client => client.VerifyIdTokenAsync("network-error-token"))
                .ThrowsAsync(httpException);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.VerifyTokenAsync("network-error-token"));

            Assert.Contains("Failed to reach Firebase Auth service", exception.Message);
            Assert.Same(httpException, exception.InnerException);
            VerifyLogger(LogLevel.Error, "Failed calling Firebase/Google APIs while verifying token");
        }

        [Fact]
        public async Task VerifyTokenAsync_Timeout_LogsAndThrowsInvalidOperationException()
        {
            var timeoutException = new TaskCanceledException("Timed out");
            _firebaseAuthClientMock.Setup(client => client.VerifyIdTokenAsync("timeout-token"))
                .ThrowsAsync(timeoutException);

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.VerifyTokenAsync("timeout-token"));

            Assert.Contains("Timed out reaching Firebase Auth service", exception.Message);
            Assert.Same(timeoutException, exception.InnerException);
            VerifyLogger(LogLevel.Error, "Timeout while calling Firebase/Google APIs during token verification");
        }

        [Fact]
        public async Task GetUserAsync_ValidUid_ReturnsUser()
        {
            var user = CreateUninitialized<UserRecord>();
            _firebaseAuthClientMock.Setup(client => client.GetUserAsync("valid-uid"))
                .ReturnsAsync(user);

            var result = await _service.GetUserAsync("valid-uid");

            Assert.Same(user, result);
        }

        [Fact]
        public async Task GetUserAsync_FirebaseFailure_WrapsException()
        {
            var firebaseException = CreateUninitialized<FirebaseAuthException>();
            _firebaseAuthClientMock.Setup(client => client.GetUserAsync("missing-uid"))
                .ThrowsAsync(firebaseException);

            var exception = await Assert.ThrowsAsync<Exception>(() => _service.GetUserAsync("missing-uid"));

            Assert.StartsWith("Error fetching user:", exception.Message);
            Assert.Same(firebaseException, exception.InnerException);
        }

        [Fact]
        public async Task UpdateUserAsync_ValidArgs_ReturnsUser()
        {
            var args = new UserRecordArgs();
            var updatedUser = CreateUninitialized<UserRecord>();
            _firebaseAuthClientMock.Setup(client => client.UpdateUserAsync(args))
                .ReturnsAsync(updatedUser);

            var result = await _service.UpdateUserAsync("uid", args);

            Assert.Same(updatedUser, result);
        }

        [Fact]
        public async Task UpdateUserAsync_FirebaseFailure_WrapsException()
        {
            var args = new UserRecordArgs();
            var firebaseException = CreateUninitialized<FirebaseAuthException>();
            _firebaseAuthClientMock.Setup(client => client.UpdateUserAsync(args))
                .ThrowsAsync(firebaseException);

            var exception = await Assert.ThrowsAsync<Exception>(() => _service.UpdateUserAsync("uid", args));

            Assert.StartsWith("Error updating user:", exception.Message);
            Assert.Same(firebaseException, exception.InnerException);
        }

        [Fact]
        public async Task DeleteUserAsync_ValidUid_DelegatesToClient()
        {
            await _service.DeleteUserAsync("valid-uid");

            _firebaseAuthClientMock.Verify(client => client.DeleteUserAsync("valid-uid"), Times.Once);
        }

        [Fact]
        public async Task DeleteUserAsync_FirebaseFailure_WrapsException()
        {
            var firebaseException = CreateUninitialized<FirebaseAuthException>();
            _firebaseAuthClientMock.Setup(client => client.DeleteUserAsync("missing-uid"))
                .ThrowsAsync(firebaseException);

            var exception = await Assert.ThrowsAsync<Exception>(() => _service.DeleteUserAsync("missing-uid"));

            Assert.StartsWith("Error deleting user:", exception.Message);
            Assert.Same(firebaseException, exception.InnerException);
        }

        private static T CreateUninitialized<T>() where T : class
        {
            return (T)RuntimeHelpers.GetUninitializedObject(typeof(T));
        }

        private void VerifyLogger(LogLevel level, string messageFragment)
        {
            _loggerMock.Verify(
                logger => logger.Log(
                    level,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((state, _) => state.ToString()!.Contains(messageFragment)),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }
    }
}
