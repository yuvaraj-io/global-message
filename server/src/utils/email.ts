import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(env.resendApiKey);

export const sendResetEmail = async (to: string, resetUrl: string) => {
  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: "Reset your Global Space password",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0A0A0A; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #555; line-height: 1.6;">
          We received a request to reset your Global Space password. Click the button below to choose a new one.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #0A0A0A; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 13px; line-height: 1.5;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `
  });
};
