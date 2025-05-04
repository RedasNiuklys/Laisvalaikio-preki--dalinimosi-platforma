using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class EquipmentUpd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment");

            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_Categories_CategoryId1",
                table: "Equipment");

            migrationBuilder.DropIndex(
                name: "IX_Equipment_CategoryId1",
                table: "Equipment");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Equipment",
                newName: "Tags");

            migrationBuilder.RenameColumn(
                name: "ImageUrls",
                table: "Equipment",
                newName: "Category");

            migrationBuilder.RenameColumn(
                name: "CategoryId1",
                table: "Equipment",
                newName: "IsAvailable");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "UsedDates",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "Equipment",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.CreateTable(
                name: "EquipmentImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: false),
                    IsMainImage = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EquipmentImages_Equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentId = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    MaintenanceDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PerformedBy = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaintenanceRecords_Equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentImages_EquipmentId",
                table: "EquipmentImages",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceRecords_EquipmentId",
                table: "MaintenanceRecords",
                column: "EquipmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment");

            migrationBuilder.DropTable(
                name: "EquipmentImages");

            migrationBuilder.DropTable(
                name: "MaintenanceRecords");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "UsedDates");

            migrationBuilder.RenameColumn(
                name: "Tags",
                table: "Equipment",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "IsAvailable",
                table: "Equipment",
                newName: "CategoryId1");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Equipment",
                newName: "ImageUrls");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "Equipment",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_CategoryId1",
                table: "Equipment",
                column: "CategoryId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_Categories_CategoryId",
                table: "Equipment",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_Categories_CategoryId1",
                table: "Equipment",
                column: "CategoryId1",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
