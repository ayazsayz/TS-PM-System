using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tspm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Attendance_OfficesAndSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Offices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    RadiusMeters = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Offices_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LocalDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CheckInAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CheckInLatitude = table.Column<double>(type: "float", nullable: true),
                    CheckInLongitude = table.Column<double>(type: "float", nullable: true),
                    CheckInAccuracyMeters = table.Column<double>(type: "float", nullable: true),
                    CheckInLocationStatus = table.Column<int>(type: "int", nullable: false),
                    CheckInOfficeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CheckInPlace = table.Column<int>(type: "int", nullable: false),
                    CheckOutAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CheckOutLatitude = table.Column<double>(type: "float", nullable: true),
                    CheckOutLongitude = table.Column<double>(type: "float", nullable: true),
                    CheckOutAccuracyMeters = table.Column<double>(type: "float", nullable: true),
                    CheckOutLocationStatus = table.Column<int>(type: "int", nullable: true),
                    CheckOutOfficeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CheckOutPlace = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceSessions_Offices_CheckInOfficeId",
                        column: x => x.CheckInOfficeId,
                        principalTable: "Offices",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AttendanceSessions_Offices_CheckOutOfficeId",
                        column: x => x.CheckOutOfficeId,
                        principalTable: "Offices",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AttendanceSessions_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_CheckInOfficeId",
                table: "AttendanceSessions",
                column: "CheckInOfficeId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_CheckOutOfficeId",
                table: "AttendanceSessions",
                column: "CheckOutOfficeId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_OrganizationId",
                table: "AttendanceSessions",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceSessions_UserId_LocalDate",
                table: "AttendanceSessions",
                columns: new[] { "UserId", "LocalDate" });

            migrationBuilder.CreateIndex(
                name: "UX_AttendanceSessions_OpenPerUser",
                table: "AttendanceSessions",
                column: "UserId",
                unique: true,
                filter: "[CheckOutAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Offices_OrganizationId",
                table: "Offices",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Offices_OrganizationId_Name",
                table: "Offices",
                columns: new[] { "OrganizationId", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttendanceSessions");

            migrationBuilder.DropTable(
                name: "Offices");
        }
    }
}
