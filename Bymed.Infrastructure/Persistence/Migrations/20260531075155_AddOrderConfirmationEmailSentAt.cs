using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderConfirmationEmailSentAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmationEmailSentAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfirmationEmailSentAt",
                table: "Orders");
        }
    }
}
