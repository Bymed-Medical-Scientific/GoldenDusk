using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogueItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CatalogueItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Brand = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeleterId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogueItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogueItems_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CatalogueItemImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CatalogueItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    AltText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogueItemImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogueItemImages_CatalogueItems_CatalogueItemId",
                        column: x => x.CatalogueItemId,
                        principalTable: "CatalogueItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CatalogueItemImages_CatalogueItemId",
                table: "CatalogueItemImages",
                column: "CatalogueItemId");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogueItemImages_CatalogueItemId_DisplayOrder",
                table: "CatalogueItemImages",
                columns: new[] { "CatalogueItemId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_CatalogueItems_Brand",
                table: "CatalogueItems",
                column: "Brand");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogueItems_CategoryId",
                table: "CatalogueItems",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogueItems_IsPublished",
                table: "CatalogueItems",
                column: "IsPublished");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogueItems_Name",
                table: "CatalogueItems",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogueItems_Slug",
                table: "CatalogueItems",
                column: "Slug",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO "CatalogueItems" (
                    "Id", "Name", "Slug", "Description", "CategoryId", "IsPublished", "Sku", "Brand",
                    "CreationTime", "CreatorId", "IsDeleted", "DeletionTime", "DeleterId",
                    "LastModificationTime", "LastModifierUserId")
                SELECT
                    "Id", "Name", "Slug", "Description", "CategoryId", "IsAvailable", "Sku", "Brand",
                    "CreationTime", "CreatorId", "IsDeleted", "DeletionTime", "DeleterId",
                    "LastModificationTime", "LastModifierUserId"
                FROM "Products"
                WHERE "IsDeleted" = false;
                """);

            migrationBuilder.Sql(
                """
                INSERT INTO "CatalogueItemImages" ("Id", "CatalogueItemId", "Url", "AltText", "DisplayOrder")
                SELECT pi."Id", pi."ProductId", pi."Url", pi."AltText", pi."DisplayOrder"
                FROM "ProductImages" pi
                INNER JOIN "CatalogueItems" c ON c."Id" = pi."ProductId";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatalogueItemImages");

            migrationBuilder.DropTable(
                name: "CatalogueItems");
        }
    }
}
