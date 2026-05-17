using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketingCampaigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MarketingCampaigns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HtmlBody = table.Column<string>(type: "character varying(100000)", maxLength: 100000, nullable: true),
                    IncludeInstitutionEmails = table.Column<bool>(type: "boolean", nullable: false),
                    IncludeContactPerson1Email = table.Column<bool>(type: "boolean", nullable: false),
                    IncludeContactPerson2Email = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketingCampaigns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketingCampaignAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MarketingCampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    StorageRelativePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketingCampaignAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarketingCampaignAttachments_MarketingCampaigns_MarketingCa~",
                        column: x => x.MarketingCampaignId,
                        principalTable: "MarketingCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MarketingCampaignClientTypes",
                columns: table => new
                {
                    MarketingCampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientTypeId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketingCampaignClientTypes", x => new { x.MarketingCampaignId, x.ClientTypeId });
                    table.ForeignKey(
                        name: "FK_MarketingCampaignClientTypes_ClientTypes_ClientTypeId",
                        column: x => x.ClientTypeId,
                        principalTable: "ClientTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MarketingCampaignClientTypes_MarketingCampaigns_MarketingCa~",
                        column: x => x.MarketingCampaignId,
                        principalTable: "MarketingCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MarketingCampaignRecipients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MarketingCampaignId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    InstitutionName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    NormalizedEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    EmailSource = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    SentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketingCampaignRecipients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarketingCampaignRecipients_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MarketingCampaignRecipients_MarketingCampaigns_MarketingCam~",
                        column: x => x.MarketingCampaignId,
                        principalTable: "MarketingCampaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaignAttachments_MarketingCampaignId",
                table: "MarketingCampaignAttachments",
                column: "MarketingCampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaignClientTypes_ClientTypeId",
                table: "MarketingCampaignClientTypes",
                column: "ClientTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaignRecipients_ClientId",
                table: "MarketingCampaignRecipients",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaignRecipients_MarketingCampaignId",
                table: "MarketingCampaignRecipients",
                column: "MarketingCampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaignRecipients_MarketingCampaignId_NormalizedE~",
                table: "MarketingCampaignRecipients",
                columns: new[] { "MarketingCampaignId", "NormalizedEmail" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaignRecipients_MarketingCampaignId_Status",
                table: "MarketingCampaignRecipients",
                columns: new[] { "MarketingCampaignId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaigns_CreatedAtUtc",
                table: "MarketingCampaigns",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_MarketingCampaigns_Status",
                table: "MarketingCampaigns",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MarketingCampaignAttachments");

            migrationBuilder.DropTable(
                name: "MarketingCampaignClientTypes");

            migrationBuilder.DropTable(
                name: "MarketingCampaignRecipients");

            migrationBuilder.DropTable(
                name: "MarketingCampaigns");
        }
    }
}
