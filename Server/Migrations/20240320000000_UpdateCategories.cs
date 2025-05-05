using Microsoft.EntityFrameworkCore.Migrations;
using System;

namespace Server.Migrations
{
    public partial class UpdateCategories : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First, drop existing foreign key constraints
            migrationBuilder.DropForeignKey(
                name: "FK_Categories_Categories_ParentCategoryId",
                table: "Categories");

            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment");

            // Drop existing categories
            migrationBuilder.Sql("DELETE FROM Categories");

            // Add new categories
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Name", "IconName", "ParentCategoryId", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    // Parent Categories
                    { 1, "Winter", "snowflake", null, DateTime.UtcNow, DateTime.UtcNow },
                    { 2, "Summer", "weather-sunny", null, DateTime.UtcNow, DateTime.UtcNow },
                    { 3, "Water", "waves", null, DateTime.UtcNow, DateTime.UtcNow },

                    // Winter Sports
                    { 4, "Snowboard", "snowboard", 1, DateTime.UtcNow, DateTime.UtcNow },
                    { 5, "Ski", "ski", 1, DateTime.UtcNow, DateTime.UtcNow },

                    // Summer Sports
                    { 6, "BBQ", "grill", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 7, "Rollerblades", "roller-skate", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 8, "Bicycle", "bike", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 9, "Golf", "golf", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 10, "Tennis", "tennis", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 11, "Basketball", "basketball", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 12, "Soccer", "soccer", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 13, "Volleyball", "volleyball", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 14, "Camping", "tent", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 15, "Hockey", "hockey-puck", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 16, "Swimming", "swim", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 17, "Running", "run", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 18, "Yoga", "yoga", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 19, "Gym", "weight", 2, DateTime.UtcNow, DateTime.UtcNow },
                    { 20, "Fitness", "dumbbell", 2, DateTime.UtcNow, DateTime.UtcNow },

                    // Water Sports
                    { 21, "Fishing", "fish", 3, DateTime.UtcNow, DateTime.UtcNow },
                    { 22, "Hiking", "hiking", 3, DateTime.UtcNow, DateTime.UtcNow },
                    { 23, "Kayaking", "kayaking", 3, DateTime.UtcNow, DateTime.UtcNow },
                    { 24, "Surfing", "surfing", 3, DateTime.UtcNow, DateTime.UtcNow }
                });

            // Recreate foreign key constraints
            migrationBuilder.AddForeignKey(
                name: "FK_Categories_Categories_ParentCategoryId",
                table: "Categories",
                column: "ParentCategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key constraints
            migrationBuilder.DropForeignKey(
                name: "FK_Categories_Categories_ParentCategoryId",
                table: "Categories");

            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment");

            // Clear categories
            migrationBuilder.Sql("DELETE FROM Categories");

            // Recreate foreign key constraints
            migrationBuilder.AddForeignKey(
                name: "FK_Categories_Categories_ParentCategoryId",
                table: "Categories",
                column: "ParentCategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}