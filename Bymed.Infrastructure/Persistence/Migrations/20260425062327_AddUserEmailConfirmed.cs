using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserEmailConfirmed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailConfirmed",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Keep existing accounts usable after rollout; only new registrations require verification.
            migrationBuilder.Sql("UPDATE \"Users\" SET \"EmailConfirmed\" = TRUE;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailConfirmed",
                table: "Users");
        }
    }
}
