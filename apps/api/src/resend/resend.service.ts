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

  /**
   * The code email in the desktop app's look: ink background, a glass pane with a
   * light rim, the wordmark with the accent Ø, and the code on its own tile.
   * Colours are the desktop tokens (desktop/src/styles/app.css) flattened to solid
   * values, since mail clients drop rgba backgrounds over gradients and blur.
   */
  private buildCodeEmailHtml({
    preview,
    title,
    body,
    code,
    footer,
  }: {
    preview: string;
    title: string;
    body: string;
    code: string;
    footer: string;
  }): string {
    const font = "'Jost','Segoe UI',system-ui,-apple-system,Roboto,sans-serif";
    const ink = '#0d0d12';
    const pane = '#16161b';
    const tile = '#1e1e25';
    const rim = 'rgba(255,255,255,0.14)';
    const accent = '#818cf8';
    const text2 = 'rgba(255,255,255,0.7)';
    const text3 = 'rgba(255,255,255,0.45)';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;700;900&display=swap" rel="stylesheet">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${ink};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${ink};background-image:radial-gradient(ellipse 70% 45% at 20% 0%,rgba(129,140,248,0.22),transparent 70%),radial-gradient(ellipse 60% 40% at 90% 10%,rgba(255,85,0,0.10),transparent 70%);">
    <tr>
      <td align="center" style="padding:48px 16px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="padding:0 8px 24px;font-family:${font};font-size:22px;font-weight:900;letter-spacing:0.12em;color:#ffffff;">EX<span style="color:${accent};">Ø</span>S</td>
          </tr>
          <tr>
            <td style="background:${pane};border:1px solid ${rim};border-radius:24px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.1),0 24px 48px rgba(0,0,0,0.45);padding:32px;">
              <h1 style="margin:0 0 8px;font-family:${font};font-size:24px;line-height:1.25;font-weight:700;color:#ffffff;">${title}</h1>
              <p style="margin:0 0 24px;font-family:${font};font-size:15px;line-height:1.6;font-weight:400;color:${text2};">${body}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:${tile};border:1px solid rgba(129,140,248,0.32);border-radius:14px;padding:22px 12px;">
                    <span style="font-family:${font};font-size:40px;line-height:1;font-weight:700;letter-spacing:0.28em;padding-left:0.28em;color:${accent};font-variant-numeric:tabular-nums;">${code}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-family:${font};font-size:13px;font-weight:500;color:${text3};">Expires in 30 minutes</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;font-family:${font};font-size:13px;line-height:1.6;color:${text3};">${footer}</td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;font-family:${font};font-size:12px;letter-spacing:0.04em;color:rgba(255,255,255,0.32);">EXØS · Deezer · SoundCloud · YouTube</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private async sendCodeEmail({
    email,
    subject,
    title,
    body,
    code,
    footer,
  }: {
    email: string;
    subject: string;
    title: string;
    body: string;
    code: string;
    footer: string;
  }): Promise<void> {
    await this.resend.emails.send({
      from: 'EXØS <noreply@phexuss.dev>',
      to: email,
      subject,
      html: this.buildCodeEmailHtml({
        preview: `${title}: ${code}`,
        title,
        body,
        code,
        footer,
      }),
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    await this.sendCodeEmail({
      email,
      subject: 'Your EXØS verification code',
      title: 'Verification code',
      body: 'Use the code below to verify your email address. Do not share it with anyone.',
      code,
      footer:
        'If you didn’t request this code, you can safely ignore this email.',
    });
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    await this.sendCodeEmail({
      email,
      subject: 'Reset your EXØS password',
      title: 'Password reset code',
      body: 'Use the code below to reset your password. Do not share it with anyone.',
      code,
      footer:
        'If you didn’t request a password reset, you can safely ignore this email.',
    });
  }
}
