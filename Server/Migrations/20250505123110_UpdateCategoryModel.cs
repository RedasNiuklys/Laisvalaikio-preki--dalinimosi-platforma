using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCategoryModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Categories");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Categories",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "TEXT",
                oldNullable: true);

            // migrationBuilder.InsertData(
            //     table: "Categories",
            //     columns: new[] { "Id", "CreatedAt", "IconName", "Name", "ParentCategoryId", "UpdatedAt" },
            //     values: new object[,]
            //     {
            //         { 1, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2222), "snowflake", "Winter", null, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2225) },
            //         { 2, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2936), "waves", "Water", null, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2937) },
            //         { 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2938), "weather-sunny", "Summer", null, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2939) },
            //         { 4, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2940), "snowboard", "Winter Sports", 1, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2940) },
            //         { 5, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2941), "ski", "Skiing", 1, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2942) },
            //         { 6, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2943), "hockey-puck", "Hockey", 1, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2943) },
            //         { 7, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2944), "swim", "Swimming", 2, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2944) },
            //         { 8, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2945), "surfing", "Surfing", 2, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2945) },
            //         { 9, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2946), "kayak", "Kayaking", 2, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2947) },
            //         { 10, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2948), "fishing", "Fishing", 2, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2948) },
            //         { 11, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2949), "bicycle", "Cycling", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2949) },
            //         { 12, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2950), "hiking", "Hiking", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2950) },
            //         { 13, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2951), "camping", "Camping", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2951) },
            //         { 14, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2953), "grill", "BBQ", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2953) },
            //         { 15, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2954), "tennis", "Tennis", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2954) },
            //         { 16, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2955), "basketball", "Basketball", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2955) },
            //         { 17, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2956), "soccer", "Soccer", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2956) },
            //         { 18, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2957), "volleyball", "Volleyball", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2958) },
            //         { 19, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2959), "run", "Running", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2959) },
            //         { 20, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2960), "yoga", "Yoga", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2960) },
            //         { 21, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2961), "golf", "Golf", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2961) },
            //         { 22, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2962), "roller-skate", "Rollerblading", 3, new DateTime(2025, 5, 5, 12, 31, 8, 817, DateTimeKind.Utc).AddTicks(2963) }
            //     });
        }

        /// <inheritdoc />
        //     protected override void Down(MigrationBuilder migrationBuilder)
        //     {
        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 4);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 5);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 6);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 7);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 8);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 9);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 10);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 11);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 12);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 13);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 14);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 15);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 16);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 17);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 18);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 19);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 20);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 21);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 22);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 1);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 2);

        //         migrationBuilder.DeleteData(
        //             table: "Categories",
        //             keyColumn: "Id",
        //             keyValue: 3);

        //         migrationBuilder.AlterColumn<DateTime>(
        //             name: "UpdatedAt",
        //             table: "Categories",
        //             type: "TEXT",
        //             nullable: true,
        //             oldClrType: typeof(DateTime),
        //             oldType: "TEXT");

        //         migrationBuilder.AddColumn<string>(
        //             name: "Description",
        //             table: "Categories",
        //             type: "TEXT",
        //             maxLength: 200,
        //             nullable: false,
        //             defaultValue: "");
        //     }
    }
}
