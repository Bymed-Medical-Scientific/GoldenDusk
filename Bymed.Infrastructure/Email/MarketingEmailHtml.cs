using System.Net;
using Microsoft.Extensions.Options;

namespace Bymed.Infrastructure.Email;

internal static class MarketingEmailHtml
{
    public static string Build(
        IOptions<EmailOptions> options,
        string institutionName,
        string? htmlBody,
        string subject)
    {
        var o = options.Value;
        var safeInstitution = WebUtility.HtmlEncode(institutionName);
        var safeSubject = WebUtility.HtmlEncode(subject);
        var safeBrandName = WebUtility.HtmlEncode(o.FromName);
        var safeWebsite = string.IsNullOrWhiteSpace(o.CompanyWebsiteUrl)
            ? "https://bymed.co.zw"
            : o.CompanyWebsiteUrl.Trim();
        var safeLogoUrl = string.IsNullOrWhiteSpace(o.LogoUrl)
            ? $"{safeWebsite.TrimEnd('/')}/images/bymed-logo.webp"
            : o.LogoUrl.Trim();

        var bodyInner = string.IsNullOrWhiteSpace(htmlBody)
            ? "<p style=\"margin:0 0 18px;\">You have a new message from Bymed Medical &amp; Scientific.</p>"
            : htmlBody;

        var logoBlock = string.IsNullOrWhiteSpace(safeLogoUrl)
            ? $"""
                <div style="font-size:26px;font-weight:700;color:#ffffff;line-height:1;">{safeBrandName}</div>
                """
            : $"""
                <img src="{WebUtility.HtmlEncode(safeLogoUrl)}" alt="{safeBrandName}" style="max-height:64px;max-width:280px;display:block;" />
                """;

        return $"""
            <!doctype html>
            <html>
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{safeSubject}</title>
              </head>
              <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{safeSubject}</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;padding:22px 10px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#ffffff;border-radius:14px;overflow:hidden;">
                        <tr>
                          <td style="padding:28px 28px 24px;background:linear-gradient(90deg,#0000CC 0%,#1C4DAA 100%);" align="center">
                            <div style="display:inline-block;background:#ffffff;border-radius:10px;padding:8px 14px;">
                              {logoBlock}
                            </div>
                            <div style="margin-top:18px;font-size:28px;line-height:1.15;font-weight:800;color:#ffffff;">
                              Bymed Medical &amp; Scientific
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:30px 40px 16px;background:#ffffff;font-size:18px;line-height:1.6;color:#1f2937;">
                            <p style="margin:0 0 18px;">Hello {safeInstitution},</p>
                            {bodyInner}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 40px 28px;font-size:16px;color:#4b5563;line-height:1.6;background:#ffffff;">
                            Regards,<br/>
                            <strong>{safeBrandName}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:22px 36px;background:#050505;font-size:14px;color:#f3f4f6;text-align:center;">
                            <div style="width:280px;height:2px;background:linear-gradient(90deg,#0000CC 0%,#1C4DAA 100%);margin:0 auto 16px;"></div>
                            <div>Copyright (C) {DateTime.UtcNow.Year} {safeBrandName}. All rights reserved.</div>
                            <div style="margin-top:12px;">
                              <a href="{WebUtility.HtmlEncode(safeWebsite)}" style="color:#93c5fd;text-decoration:none;">{WebUtility.HtmlEncode(safeWebsite)}</a>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
            """;
    }
}
