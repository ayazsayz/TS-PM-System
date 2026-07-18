using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tspm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MultiTenant_Organizations : Migration
    {
        // All data that existed before multi-tenancy is migrated into this
        // "Default Organization" so nothing is lost and everyone keeps working.
        private static readonly Guid DefaultOrgId = new("11111111-1111-1111-1111-111111111111");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Organizations table + the Default Organization row (must exist before the
            //    OrganizationId columns reference it).
            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Organizations",
                columns: new[] { "Id", "Name", "Slug", "IsActive", "CreatedAt" },
                values: new object[]
                {
                    DefaultOrgId,
                    "Default Organization",
                    "default",
                    true,
                    new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                });

            // 2) OrganizationId on every tenant table. The defaultValue backfills all
            //    existing rows into the Default Organization.
            foreach (var table in new[]
            {
                "AspNetUsers", "Clients", "Projects", "ProjectMembers",
                "TimeEntries", "Timesheets", "TodoTasks", "AuditLog", "Notifications",
            })
            {
                migrationBuilder.AddColumn<Guid>(
                    name: "OrganizationId",
                    table: table,
                    type: "uniqueidentifier",
                    nullable: false,
                    defaultValue: DefaultOrgId);

                migrationBuilder.CreateIndex(
                    name: $"IX_{table}_OrganizationId",
                    table: table,
                    column: "OrganizationId");
            }

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Slug",
                table: "Organizations",
                column: "Slug",
                unique: true);

            // 3) Foreign keys — valid now that every row points at the Default Organization.
            foreach (var table in new[]
            {
                "AspNetUsers", "AuditLog", "Clients", "Notifications",
                "ProjectMembers", "Projects", "TimeEntries", "Timesheets", "TodoTasks",
            })
            {
                migrationBuilder.AddForeignKey(
                    name: $"FK_{table}_Organizations_OrganizationId",
                    table: table,
                    column: "OrganizationId",
                    principalTable: "Organizations",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var table in new[]
            {
                "AspNetUsers", "AuditLog", "Clients", "Notifications",
                "ProjectMembers", "Projects", "TimeEntries", "Timesheets", "TodoTasks",
            })
            {
                migrationBuilder.DropForeignKey(
                    name: $"FK_{table}_Organizations_OrganizationId",
                    table: table);
                migrationBuilder.DropIndex(
                    name: $"IX_{table}_OrganizationId",
                    table: table);
                migrationBuilder.DropColumn(
                    name: "OrganizationId",
                    table: table);
            }

            migrationBuilder.DropTable(name: "Organizations");
        }
    }
}
