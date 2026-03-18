import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    const data = await resend.emails.send({
      from: 'BrewFlow <noreply@brewqr.com>', // Using custom configured domain
      to: email,
      subject: 'Reset your BrewFlow password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Password Reset Request</h2>
          <p>You recently requested to reset your password for your BrewFlow account.</p>
          <p>Click the button below to reset it. <strong>This link is valid for 1 hour.</strong></p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 60 minutes.</p>
          <p style="font-size: 14px; color: #666;">Thanks,<br>The BrewFlow Team</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}
