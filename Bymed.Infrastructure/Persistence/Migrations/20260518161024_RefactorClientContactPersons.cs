using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorClientContactPersons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Clients",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telephone",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Clients"
                SET "Email" = NULLIF(TRIM(COALESCE("Email1", "Email2", "Email3")), ''),
                    "Phone" = NULLIF(TRIM(COALESCE("PhoneNumber1", "PhoneNumber2", "PhoneNumber3")), ''),
                    "Telephone" = NULLIF(TRIM(COALESCE("TelephoneNumber1", "TelephoneNumber2", "TelephoneNumber3")), '');
                """);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeContactPersonEmails",
                table: "MarketingCampaigns",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                """
                UPDATE "MarketingCampaigns"
                SET "IncludeContactPersonEmails" = "IncludeContactPerson1Email" OR "IncludeContactPerson2Email";
                """);

            migrationBuilder.CreateTable(
                name: "ClientContactPersons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Faculty = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientContactPersons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientContactPersons_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientContactPersons_ClientId",
                table: "ClientContactPersons",
                column: "ClientId");

            migrationBuilder.Sql(
                """
                INSERT INTO "ClientContactPersons" ("Id", "ClientId", "Name", "Email", "Phone", "Faculty")
                SELECT gen_random_uuid(), "Id", TRIM("ContactPerson1Name"),
                       NULLIF(TRIM("ContactPerson1Email"), ''),
                       NULLIF(TRIM("ContactPerson1Telephone"), ''),
                       NULL
                FROM "Clients"
                WHERE "ContactPerson1Name" IS NOT NULL AND TRIM("ContactPerson1Name") <> '';

                INSERT INTO "ClientContactPersons" ("Id", "ClientId", "Name", "Email", "Phone", "Faculty")
                SELECT gen_random_uuid(), "Id", TRIM("ContactPerson2Name"),
                       NULLIF(TRIM("ContactPerson2Email"), ''),
                       NULLIF(TRIM("ContactPerson2Telephone"), ''),
                       NULL
                FROM "Clients"
                WHERE "ContactPerson2Name" IS NOT NULL AND TRIM("ContactPerson2Name") <> '';
                """);

            migrationBuilder.Sql(
                """
                UPDATE "MarketingCampaignRecipients"
                SET "EmailSource" = 1
                WHERE "EmailSource" IN (1, 2, 3);

                UPDATE "MarketingCampaignRecipients"
                SET "EmailSource" = 2
                WHERE "EmailSource" IN (4, 5);
                """);

            migrationBuilder.DropColumn(name: "IncludeContactPerson1Email", table: "MarketingCampaigns");
            migrationBuilder.DropColumn(name: "IncludeContactPerson2Email", table: "MarketingCampaigns");

            migrationBuilder.DropColumn(name: "ContactPerson1Email", table: "Clients");
            migrationBuilder.DropColumn(name: "ContactPerson1Name", table: "Clients");
            migrationBuilder.DropColumn(name: "ContactPerson1Telephone", table: "Clients");
            migrationBuilder.DropColumn(name: "ContactPerson2Email", table: "Clients");
            migrationBuilder.DropColumn(name: "ContactPerson2Name", table: "Clients");
            migrationBuilder.DropColumn(name: "ContactPerson2Telephone", table: "Clients");
            migrationBuilder.DropColumn(name: "Email1", table: "Clients");
            migrationBuilder.DropColumn(name: "Email2", table: "Clients");
            migrationBuilder.DropColumn(name: "Email3", table: "Clients");
            migrationBuilder.DropColumn(name: "PhoneNumber1", table: "Clients");
            migrationBuilder.DropColumn(name: "PhoneNumber2", table: "Clients");
            migrationBuilder.DropColumn(name: "PhoneNumber3", table: "Clients");
            migrationBuilder.DropColumn(name: "TelephoneNumber1", table: "Clients");
            migrationBuilder.DropColumn(name: "TelephoneNumber2", table: "Clients");
            migrationBuilder.DropColumn(name: "TelephoneNumber3", table: "Clients");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ClientContactPersons");

            migrationBuilder.DropColumn(name: "Email", table: "Clients");
            migrationBuilder.DropColumn(name: "Phone", table: "Clients");
            migrationBuilder.DropColumn(name: "Telephone", table: "Clients");

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson1Email",
                table: "Clients",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson1Name",
                table: "Clients",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson1Telephone",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson2Email",
                table: "Clients",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson2Name",
                table: "Clients",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson2Telephone",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email1",
                table: "Clients",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email2",
                table: "Clients",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email3",
                table: "Clients",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber1",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber2",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber3",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelephoneNumber1",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelephoneNumber2",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelephoneNumber3",
                table: "Clients",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.DropColumn(name: "IncludeContactPersonEmails", table: "MarketingCampaigns");

            migrationBuilder.AddColumn<bool>(
                name: "IncludeContactPerson1Email",
                table: "MarketingCampaigns",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeContactPerson2Email",
                table: "MarketingCampaigns",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
