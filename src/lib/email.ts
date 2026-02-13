import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  await transporter.sendMail({
    from: from,
    to,
    subject: "Your password reset OTP - Children.lk",
    html: `
      <p>Your one-time password for resetting your password is: <strong>${otp}</strong></p>
      <p>This OTP expires in 10 minutes. Do not share it with anyone.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}

export async function sendOrganizerCredentialsEmail(
  to: string,
  name: string,
  loginEmail: string,
  password: string
): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  await transporter.sendMail({
    from: from,
    to,
    subject: "Your organizer account - Children.lk",
    html: `
      <p>Hi ${name},</p>
      <p>Your organizer account on Children.lk has been created. Here are your login credentials:</p>
      <p><strong>Email:</strong> ${loginEmail}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please sign in at the login page and consider changing your password after your first login.</p>
      <p>Do not share these credentials with anyone.</p>
    `,
  });
}
