using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderSessionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "Orders",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_SessionId",
                table: "Orders",
                column: "SessionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_SessionId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "Orders");
        }
    }
}
