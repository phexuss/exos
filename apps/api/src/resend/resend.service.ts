import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  async sendVerificationEmail(email: string, code: string) {
    await this.resend.emails.send({
      from: 'EXØS <noreply@phexuss.dev>',
      to: email,
      subject: 'Your EXØS verification code',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#121212;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:40px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#1A1A1A;border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <tr>
            <td align="center" style="padding:32px 32px 24px;">
              <span style="
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:24px;
                font-weight:800;
                letter-spacing:4px;
                color:#FFFFFF;
              ">EXØS</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 0;">
              <p style="
                margin:0 0 8px;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:22px;
                font-weight:700;
                color:#FFFFFF;
              ">Verification code</p>
              <p style="
                margin:0 0 28px;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:14px;
                color:rgba(255,255,255,0.55);
                line-height:1.6;
              ">Use this code to verify your email address.<br/>Do not share it with anyone.</p>
              <div style="
                background:#212121;
                border:1px solid rgba(255,255,255,0.12);
                border-radius:14px;
                padding:24px 16px;
                text-align:center;
                margin-bottom:16px;
              ">
                <span style="
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                  font-size:40px;
                  font-weight:700;
                  letter-spacing:12px;
                  color:#FFFFFF;
                  font-variant-numeric:tabular-nums;
                ">${code}</span>
              </div>
              <p style="
                margin:0 0 32px;
                text-align:center;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:12px;
                color:rgba(255,255,255,0.4);
              ">Expires in 30 minutes</p>

            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="
                background:rgba(255,255,255,0.03);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:10px;
                padding:12px 16px;
              ">
                <p style="
                  margin:0;
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                  font-size:12px;
                  color:rgba(255,255,255,0.45);
                  line-height:1.6;
                ">If you didn’t request this code, you can safely ignore this email.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px 28px;">
              <p style="
                margin:0;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:12px;
                color:rgba(255,255,255,0.3);
              ">© ${new Date().getFullYear()} EXØS</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    });
  }
}
