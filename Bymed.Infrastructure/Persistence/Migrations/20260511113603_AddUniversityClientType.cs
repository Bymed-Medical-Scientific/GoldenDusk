using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniversityClientType : Migration
    {
        private static readonly Guid UniversityId = new("c2d4f6a8-9012-4ef3-bcde-112233445566");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ClientTypes",
                columns: new[] { "Id", "Name", "Slug", "CreationTime", "CreatorId", "IsDeleted" },
                values: new object[] { UniversityId, "University", "university", DateTime.UtcNow, null, false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ClientTypes",
                keyColumn: "Id",
                keyValue: UniversityId);
        }
    }
}
