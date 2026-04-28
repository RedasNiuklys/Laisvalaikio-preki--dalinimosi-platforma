using Server.DataTransferObjects;
using Server.Models;
using Server.Services.Storage;
using Xunit;

namespace Server.Tests
{
    /// <summary>
    /// Ensures all DTO and model classes are instantiated, covering their constructors/properties.
    /// </summary>
    public class ModelAndDtoCoverageTests
    {
        [Fact]
        public void CreateEquipmentImageDto_Properties_Work()
        {
            var dto = new CreateEquipmentImageDto
            {
                ImageUrl = "https://example.com/img.jpg",
                IsMainImage = true
            };
            Assert.Equal("https://example.com/img.jpg", dto.ImageUrl);
            Assert.True(dto.IsMainImage);
        }

        [Fact]
        public void EquipmentImageResponseDto_Properties_Work()
        {
            var dto = new EquipmentImageResponseDto
            {
                Id = "img-1",
                EquipmentId = "eq-1",
                ImageUrl = "https://example.com/img.jpg",
                IsMainImage = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            Assert.Equal("img-1", dto.Id);
            Assert.Equal("eq-1", dto.EquipmentId);
            Assert.False(dto.IsMainImage);
        }

        [Fact]
        public void ErrorResponseDto_Properties_Work()
        {
            var dto = new ErrorResponseDto { Message = "An error occurred" };
            Assert.Equal("An error occurred", dto.Message);
        }

        [Fact]
        public void MessageDto_Properties_Work()
        {
            var dto = new MessageDto
            {
                Id = "msg-1",
                Content = "Hello world",
                SentAt = DateTime.UtcNow,
                Sender = new UserDto { Id = "user-1", FirstName = "John", LastName = "Doe" }
            };
            Assert.Equal("msg-1", dto.Id);
            Assert.Equal("Hello world", dto.Content);
            Assert.Equal("John", dto.Sender.FirstName);
        }

        [Fact]
        public void ReadReceiptDto_Properties_Work()
        {
            var dto = new ReadReceiptDto
            {
                Id = "rr-1",
                FirstName = "Jane",
                LastName = "Doe",
                ReadAt = DateTime.UtcNow
            };
            Assert.Equal("rr-1", dto.Id);
            Assert.Equal("Jane", dto.FirstName);
        }

        [Fact]
        public void UpdateBookingStatusDto_Properties_Work()
        {
            var dto = new UpdateBookingStatusDto { Status = BookingStatus.Approved };
            Assert.Equal(BookingStatus.Approved, dto.Status);
        }

        [Fact]
        public void UserSearchResultDto_Properties_Work()
        {
            var dto = new UserSearchResultDto
            {
                Id = "u-1",
                UserName = "jdoe",
                FirstName = "John",
                LastName = "Doe",
                Email = "john@example.com",
                AvatarUrl = "https://example.com/avatar.jpg"
            };
            Assert.Equal("u-1", dto.Id);
            Assert.Equal("jdoe", dto.UserName);
        }

        [Fact]
        public void MaintenanceRecord_Properties_Work()
        {
            var record = new MaintenanceRecord
            {
                Id = 1,
                EquipmentId = "eq-1",
                Title = "Annual Check",
                Description = "Full inspection",
                MaintenanceDate = DateTime.UtcNow,
                PerformedBy = "Technician",
                Notes = "All good",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            Assert.Equal(1, record.Id);
            Assert.Equal("Annual Check", record.Title);
            Assert.Equal("Technician", record.PerformedBy);
        }

        [Fact]
        public void StorageOptions_Properties_Work()
        {
            var opts = new StorageOptions
            {
                Provider = "S3",
                LocalRootPath = "/tmp/storage",
                S3BucketName = "my-bucket",
                S3Region = "us-east-1",
                S3KeyPrefix = "uploads/",
                S3PublicBaseUrl = "https://cdn.example.com"
            };
            Assert.Equal("S3", opts.Provider);
            Assert.Equal("/tmp/storage", opts.LocalRootPath);
            Assert.Equal("my-bucket", opts.S3BucketName);
        }

        [Fact]
        public void ChatParticipant_Properties_Work()
        {
            var p = new ChatParticipant
            {
                Id = 1,
                ChatId = 10,
                UserId = "u-1",
                IsAdmin = true,
                JoinedAt = DateTime.UtcNow
            };
            Assert.Equal(1, p.Id);
            Assert.True(p.IsAdmin);
        }

        [Fact]
        public void Friendship_Properties_Work()
        {
            var f = new Friendship
            {
                RequesterId = "u-1",
                AddresseeId = "u-2",
                Status = FriendshipStatus.Accepted,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            Assert.Equal("u-1", f.RequesterId);
            Assert.Equal(FriendshipStatus.Accepted, f.Status);
        }

        [Fact]
        public void ApplicationUser_Properties_Work()
        {
            var user = new ApplicationUser
            {
                FirebaseUid = "fb-uid",
                FirstName = "Alice",
                LastName = "Smith",
                Theme = "dark",
                AvatarUrl = "https://example.com/avatar.jpg"
            };
            Assert.Equal("fb-uid", user.FirebaseUid);
            Assert.Equal("Alice", user.FirstName);
            Assert.Equal("dark", user.Theme);
        }

        [Fact]
        public void UpdateUserDto_AllProperties_Work()
        {
            var dto = new UpdateUserDto
            {
                UserName = "alice",
                FirstName = "Alice",
                LastName = "Smith",
                Theme = "light",
                Email = "alice@example.com",
                AvatarUrl = "https://example.com/avatar.jpg"
            };
            Assert.Equal("alice", dto.UserName);
            Assert.Equal("alice@example.com", dto.Email);
            Assert.Equal("https://example.com/avatar.jpg", dto.AvatarUrl);
        }
    }
}
