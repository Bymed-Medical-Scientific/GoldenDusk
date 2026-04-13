namespace Bymed.Application.Products;

public static class ProductClientTypes
{
    public const string School = "school";
    public const string UniversityCollege = "university-college";
    public const string HospitalClinic = "hospital-clinic";
    public const string NursingSchool = "nursing-school";

    public static readonly IReadOnlySet<string> Allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        School,
        UniversityCollege,
        HospitalClinic,
        NursingSchool
    };
}
