using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bymed.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClientsAndClientTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var highSchoolId = new Guid("d90f7f1f-5702-4cb6-9fd4-8c86195f98ef");
            var collegeId = new Guid("9f53c10d-c0ac-4f6c-97db-6a4ef6f86c5e");
            var clinicId = new Guid("0b5dce35-7081-48a7-9df0-3f32ce3e3358");
            var hospitalId = new Guid("0f39c698-d1f8-4bdd-b1f4-477f16d2c2dd");
            var privateDoctorId = new Guid("0e810d9f-c4c3-4349-996a-d26f9d29df3d");

            migrationBuilder.CreateTable(
                name: "ClientTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
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
                    table.PrimaryKey("PK_ClientTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InstitutionName = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Address = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false),
                    Email1 = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    Email2 = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    Email3 = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    PhoneNumber1 = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    PhoneNumber2 = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    PhoneNumber3 = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    TelephoneNumber1 = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    TelephoneNumber2 = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    TelephoneNumber3 = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ContactPerson1Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ContactPerson1Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    ContactPerson1Telephone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ContactPerson2Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    ContactPerson2Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    ContactPerson2Telephone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ClientTypeId = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_Clients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clients_ClientTypes_ClientTypeId",
                        column: x => x.ClientTypeId,
                        principalTable: "ClientTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clients_ClientTypeId",
                table: "Clients",
                column: "ClientTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_InstitutionName",
                table: "Clients",
                column: "InstitutionName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientTypes_Name",
                table: "ClientTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClientTypes_Slug",
                table: "ClientTypes",
                column: "Slug",
                unique: true);

            migrationBuilder.InsertData(
                table: "ClientTypes",
                columns: new[] { "Id", "Name", "Slug", "CreationTime", "CreatorId", "IsDeleted" },
                values: new object[,]
                {
                    { highSchoolId, "High School", "high-school", DateTime.UtcNow, null, false },
                    { collegeId, "College", "college", DateTime.UtcNow, null, false },
                    { clinicId, "Clinic", "clinic", DateTime.UtcNow, null, false },
                    { hospitalId, "Hospital", "hospital", DateTime.UtcNow, null, false },
                    { privateDoctorId, "Private Doctor", "private-doctor", DateTime.UtcNow, null, false }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "ClientTypes");
        }
    }
}
