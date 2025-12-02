using Server.Models;
using Microsoft.AspNetCore.Identity;

namespace Server.Tests
{
    public static class TestData
    {
        public static async Task SeedTestData(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            // Create test users
            var user1 = new ApplicationUser
            {
                UserName = "testuser1@example.com",
                Email = "testuser1@example.com",
                FirstName = "Test",
                LastName = "User 1"
            };

            var user2 = new ApplicationUser
            {
                UserName = "testuser2@example.com",
                Email = "testuser2@example.com",
                FirstName = "Test",
                LastName = "User 2"
            };

            await userManager.CreateAsync(user1, "Test123!");
            await userManager.CreateAsync(user2, "Test123!");

            // Add test categories
            var categories = new List<Category>
            {
                new Category { Name = "Sports" },
                new Category { Name = "Electronics" },
                new Category { Name = "Books" }
            };
            await context.Categories.AddRangeAsync(categories);

            // Add test equipment
            var equipment = new List<Equipment>
            {
                new Equipment
                {
                    Name = "Test Equipment 1",
                    Description = "Test Description 1",
                    OwnerId = user1.Id,
                    CategoryId = categories[0].Id
                },
                new Equipment
                {
                    Name = "Test Equipment 2",
                    Description = "Test Description 2",
                    OwnerId = user2.Id,
                    CategoryId = categories[1].Id
                }
            };
            await context.Equipment.AddRangeAsync(equipment);

            await context.SaveChangesAsync();
        }
    }
}