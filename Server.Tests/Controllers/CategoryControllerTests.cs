using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Controllers;
using Server.DataTransferObjects;
using Server.Models;
using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Server.Tests.Controllers
{
    public class CategoryControllerTests
    {
        private readonly CategoryController _controller;
        private readonly ApplicationDbContext _context;

        public CategoryControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _controller = new CategoryController(_context);

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            // Add parent categories
            var parentCategory = new Category
            {
                Id = 1,
                Name = "Parent Category",
                IconName = "parent-icon",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var subCategory = new Category
            {
                Id = 2,
                Name = "Sub Category",
                IconName = "sub-icon",
                ParentCategoryId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Categories.AddRange(parentCategory, subCategory);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetCategories_ReturnsAllCategories()
        {
            // Act
            var result = await _controller.GetCategories();

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<CategoryResponseDto>>>(result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<CategoryResponseDto>>(okResult.Value);
            var categories = returnValue.ToList();

            Assert.Equal(2, categories.Count);
            Assert.Equal("Parent Category", categories[0].Name);
            Assert.Equal("Sub Category", categories[1].Name);
            Assert.Equal(1, categories[1].ParentCategoryId);
        }

        [Fact]
        public async Task GetCategory_ValidId_ReturnsCategory()
        {
            // Act
            var result = await _controller.GetCategory(1);

            // Assert
            var okResult = Assert.IsType<ActionResult<CategoryResponseDto>>(result);
            var returnValue = Assert.IsType<CategoryResponseDto>(okResult.Value);

            Assert.Equal(1, returnValue.Id);
            Assert.Equal("Parent Category", returnValue.Name);
            Assert.Equal("parent-icon", returnValue.IconName);
            Assert.Null(returnValue.ParentCategoryId);
            Assert.Single(returnValue.Categories);
        }

        [Fact]
        public async Task GetCategory_InvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.GetCategory(999);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateCategory_ValidData_ReturnsCreatedCategory()
        {
            // Arrange
            var createDto = new CreateCategoryDto
            {
                Name = "New Category",
                IconName = "new-icon",
                ParentCategoryId = 1
            };

            // Act
            var result = await _controller.CreateCategory(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var returnValue = Assert.IsType<CategoryResponseDto>(createdResult.Value);

            Assert.Equal("New Category", returnValue.Name);
            Assert.Equal("new-icon", returnValue.IconName);
            Assert.Equal(1, returnValue.ParentCategoryId);
            Assert.NotNull(returnValue.CreatedAt);
        }

        [Fact]
        public async Task UpdateCategory_ValidData_ReturnsNoContent()
        {
            // Arrange
            var updateDto = new UpdateCategoryDto
            {
                Name = "Updated Category",
                IconName = "updated-icon",
                ParentCategoryId = null
            };

            // Act
            var result = await _controller.UpdateCategory(1, updateDto);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify the update in database
            var updatedCategory = await _context.Categories.FindAsync(1);
            Assert.Equal("Updated Category", updatedCategory.Name);
            Assert.Equal("updated-icon", updatedCategory.IconName);
            Assert.Null(updatedCategory.ParentCategoryId);
        }

        [Fact]
        public async Task UpdateCategory_InvalidId_ReturnsNotFound()
        {
            // Arrange
            var updateDto = new UpdateCategoryDto
            {
                Name = "Updated Category",
                IconName = "updated-icon"
            };

            // Act
            var result = await _controller.UpdateCategory(999, updateDto);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteCategory_ValidId_ReturnsNoContent()
        {
            // Act
            var result = await _controller.DeleteCategory(2);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify deletion
            var deletedCategory = await _context.Categories.FindAsync(2);
            Assert.Null(deletedCategory);
        }

        [Fact]
        public async Task DeleteCategory_InvalidId_ReturnsNotFound()
        {
            // Act
            var result = await _controller.DeleteCategory(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteCategory_WithSubcategories_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.DeleteCategory(1);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Cannot delete category with subcategories or equipment", badRequestResult.Value);
        }

        [Fact]
        public async Task GetSubcategories_ValidId_ReturnsSubcategories()
        {
            // Act
            var result = await _controller.GetSubcategories(1);

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<CategoryResponseDto>>>(result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<CategoryResponseDto>>(okResult.Value);
            var subcategories = returnValue.ToList();

            Assert.Single(subcategories);
            Assert.Equal("Sub Category", subcategories[0].Name);
            Assert.Equal(1, subcategories[0].ParentCategoryId);
        }

        [Fact]
        public async Task GetSubcategories_InvalidId_ReturnsEmptyList()
        {
            // Act
            var result = await _controller.GetSubcategories(999);

            // Assert
            var okResult = Assert.IsType<ActionResult<IEnumerable<CategoryResponseDto>>>(result);
            var returnValue = Assert.IsAssignableFrom<IEnumerable<CategoryResponseDto>>(okResult.Value);
            Assert.Empty(returnValue);
        }
    }
}