// Simple table-based layout with all styles inline, since email clients
// (especially Outlook) don't reliably support <style> blocks or modern CSS.
function buildEmailHtml({ heading, bodyHtml, ctaText, ctaUrl, footnote }) {
  return `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:#F3EFE6; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3EFE6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff;">
            <tr>
              <td style="background-color:#1B2A3D; padding:24px 32px;">
                <span style="font-size:20px; font-weight:bold; color:#F3EFE6; letter-spacing:0.5px;">PROPERTY&nbsp;</span><span style="font-size:20px; font-weight:bold; color:#C79A5B; letter-spacing:0.5px;">HUB</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:22px; line-height:1.3; color:#1C1A17;">${heading}</h1>
                <div style="font-size:15px; line-height:1.6; color:#41473F;">${bodyHtml}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="background-color:#C79A5B; border-radius:2px;">
                      <a href="${ctaUrl}" style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:bold; color:#1B2A3D; text-decoration:none;">${ctaText}</a>
                    </td>
                  </tr>
                </table>
                ${footnote ? `<p style="margin:24px 0 0; font-size:13px; line-height:1.5; color:#8A8577;">${footnote}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="background-color:#141F2C; padding:20px 32px;">
                <p style="margin:0; font-size:12px; line-height:1.5; color:#9AA5B1;">
                  Property Hub, 4 Harbour Row, Bristol BS1 4ST<br />
                  © ${new Date().getFullYear()} Property Hub
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = { buildEmailHtml };
