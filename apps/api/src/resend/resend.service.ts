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
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:60px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#1A1A1A;border-radius:24px;border:1px solid rgba(255,255,255,0.08);border-top:2px solid #818cf8;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          
          <tr>
            <td align="center" style="padding:40px 32px 24px;">
              <span style="
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:24px;
                font-weight:800;
                letter-spacing:6px;
                color:#FFFFFF;
                font-style:italic;
              ">EXØS</span>
            </td>
          </tr>
          
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:rgba(255,255,255,0.05);"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding:32px 32px 0;">
              <h1 style="
                margin:0 0 12px;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:22px;
                font-weight:700;
                color:#FFFFFF;
                letter-spacing:-0.5px;
              ">Verification code</h1>
              
              <p style="
                margin:0 0 32px;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:15px;
                color:rgba(255,255,255,0.6);
                line-height:1.6;
                font-weight:300;
              ">Use the code below to verify your email address. Do not share it with anyone.</p>
                            <div style="
                background:#212121;
                border:1px solid rgba(129,140,248,0.2);
                border-radius:16px;
                padding:28px 16px;
                text-align:center;
                margin-bottom:16px;
              ">
                <span style="
                  font-family:'Geist Mono','SF Mono',Menlo,Consolas,monospace;
                  font-size:42px;
                  font-weight:700;
                  letter-spacing:14px;
                  color:#818cf8;
                  font-variant-numeric:tabular-nums;
                ">${code}</span>
              </div>
                            <p style="
                margin:0 0 40px;
                text-align:center;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                font-size:13px;
                font-weight:500;
                color:rgba(255,255,255,0.4);
              ">Expires in 30 minutes</p>
            </td>
          </tr>
                    <tr>
            <td style="padding:0 32px 32px;">
              <div style="
                background:rgba(255,255,255,0.02);
                border:1px solid rgba(255,255,255,0.06);
                border-radius:12px;
                padding:16px;
              ">
                <p style="
                  margin:0;
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                  font-size:13px;
                  color:rgba(255,255,255,0.45);
                  line-height:1.6;
                  font-weight:300;
                ">If you didn’t request this code, you can safely ignore this email.</p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
        <tr>
      <td align="center" style="padding:32px 16px;">
        <p style="
          margin:0;
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
          font-size:12px;
          color:rgba(255,255,255,0.3);
          letter-spacing:0.5px;
        ">© ${new Date().getFullYear()} EXØS. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    });
  }
}
