using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCategorySeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "CreatedAt", "IconName", "Name", "ParentCategoryId", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "snowflake", "Winter", null, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "waves", "Water", null, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "weather-sunny", "Summer", null, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 4, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "snowboard", "Winter Sports", 1, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 5, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "ski", "Skiing", 1, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 6, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "hockey-puck", "Hockey", 1, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 7, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "swim", "Swimming", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 8, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "surfing", "Surfing", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 9, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "kayak", "Kayaking", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 10, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "fishing", "Fishing", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 11, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "bicycle", "Cycling", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 12, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "hiking", "Hiking", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 13, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "camping", "Camping", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 14, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "grill", "BBQ", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 15, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "tennis", "Tennis", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 16, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "basketball", "Basketball", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 17, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "soccer", "Soccer", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 18, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "volleyball", "Volleyball", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 19, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "run", "Running", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 20, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "yoga", "Yoga", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 21, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "golf", "Golf", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 22, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), "roller-skate", "Rollerblading", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) }
                });
        }
    }
}
