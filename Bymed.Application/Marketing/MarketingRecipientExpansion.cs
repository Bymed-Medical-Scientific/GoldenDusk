using System.Net.Mail;
using Bymed.Application.Clients;
using Bymed.Domain.Entities;

namespace Bymed.Application.Marketing;

public static class MarketingRecipientExpansion
{
    public static bool IsValidEmail(string? raw, out string trimmedEmail, out string normalized)
    {
        trimmedEmail = string.Empty;
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        var t = raw.Trim();
        if (t.Length > MarketingCampaignRecipient.EmailMaxLength)
            return false;

        if (!MailAddress.TryCreate(t, out var addr))
            return false;

        trimmedEmail = addr.Address;
        normalized = trimmedEmail.ToLowerInvariant();
        return true;
    }

    public static void CollectRecipients(
        ClientMarketingProjection client,
        Guid campaignId,
        bool includeInstitution,
        bool includeCp1,
        bool includeCp2,
        HashSet<string> seenNormalized,
        List<MarketingCampaignRecipient> output)
    {
        void TryAdd(MarketingRecipientEmailSource source, string? raw)
        {
            if (!IsValidEmail(raw, out var email, out var norm))
                return;
            if (!seenNormalized.Add(norm))
                return;

            var name = client.InstitutionName;
            if (name.Length > MarketingCampaignRecipient.InstitutionNameMaxLength)
                name = name[..MarketingCampaignRecipient.InstitutionNameMaxLength];

            output.Add(new MarketingCampaignRecipient
            {
                Id = Guid.NewGuid(),
                MarketingCampaignId = campaignId,
                ClientId = client.Id,
                InstitutionName = name,
                Email = email,
                NormalizedEmail = norm,
                EmailSource = source,
                Status = MarketingCampaignRecipientStatus.Pending
            });
        }

        if (includeInstitution)
        {
            TryAdd(MarketingRecipientEmailSource.InstitutionEmail1, client.Email1);
            TryAdd(MarketingRecipientEmailSource.InstitutionEmail2, client.Email2);
            TryAdd(MarketingRecipientEmailSource.InstitutionEmail3, client.Email3);
        }

        if (includeCp1)
            TryAdd(MarketingRecipientEmailSource.ContactPerson1Email, client.ContactPerson1Email);
        if (includeCp2)
            TryAdd(MarketingRecipientEmailSource.ContactPerson2Email, client.ContactPerson2Email);
    }
}
