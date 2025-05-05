using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    public partial class RecreateCategoryTable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop existing table
            migrationBuilder.DropTable("Categories");

            // Create new table
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    IconName = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ParentCategoryId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ParentCategoryId",
                        column: x => x.ParentCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // Create index
            migrationBuilder.CreateIndex(
                name: "IX_Categories_ParentCategoryId",
                table: "Categories",
                column: "ParentCategoryId");

            // Seed data
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Name", "IconName", "ParentCategoryId", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "Winter", "snowflake", null, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 2, "Water", "waves", null, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 3, "Summer", "weather-sunny", null, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 4, "Winter Sports", "snowboard", 1, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 5, "Skiing", "ski", 1, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 6, "Hockey", "hockey-puck", 1, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 7, "Swimming", "swim", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 8, "Surfing", "surfing", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 9, "Kayaking", "kayak", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 10, "Fishing", "fishing", 2, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 11, "Cycling", "bicycle", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 12, "Hiking", "hiking", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 13, "Camping", "camping", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 14, "BBQ", "grill", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 15, "Tennis", "tennis", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 16, "Basketball", "basketball", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 17, "Soccer", "soccer", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 18, "Volleyball", "volleyball", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 19, "Running", "run", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 20, "Yoga", "yoga", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 21, "Golf", "golf", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) },
                    { 22, "Rollerblading", "roller-skate", 3, new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc), new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc) }
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("Categories");
        }
    }
}