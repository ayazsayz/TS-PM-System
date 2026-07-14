using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tspm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProjectRatesAndArchiving : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ActualHours and Spent are now computed from logged time entries, so the
            // stored rollups are dropped. Spent is deliberately NOT renamed to HourlyRate:
            // the old value is a running total, not a rate, and carrying it over would
            // produce nonsense rates (e.g. a $122,000/hour project).
            migrationBuilder.DropColumn(
                name: "ActualHours",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Spent",
                table: "Projects");

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "Projects",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Projects",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Clients",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "Projects");

            migrationBuilder.AddColumn<decimal>(
                name: "Spent",
                table: "Projects",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ActualHours",
                table: "Projects",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
