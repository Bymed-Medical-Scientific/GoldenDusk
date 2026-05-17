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
            // Idempotent: DBs that already have "University" (manual seed, restore, or earlier attempt) must not fail startup.
            migrationBuilder.Sql(
                $"""
                INSERT INTO "ClientTypes" ("Id", "Name", "Slug", "CreationTime", "CreatorId", "IsDeleted", "DeletionTime", "DeleterId", "LastModificationTime", "LastModifierUserId")
                SELECT '{UniversityId}', 'University', 'university', NOW() AT TIME ZONE 'utc', NULL, false, NULL, NULL, NULL, NULL
                WHERE NOT EXISTS (
                    SELECT 1 FROM "ClientTypes" AS c
                    WHERE c."Slug" = 'university' OR LOWER(TRIM(c."Name")) = LOWER('University')
                );
                """);
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
