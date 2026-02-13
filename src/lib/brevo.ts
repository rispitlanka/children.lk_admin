import * as brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = "Your password reset OTP - Children.lk";
  sendSmtpEmail.sender = {
    name: process.env.BREVO_SENDER_NAME ?? "Children.lk",
    email: process.env.BREVO_SENDER_EMAIL ?? "noreply@children.lk",
  };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.htmlContent = `
    <p>Your one-time password for resetting your password is: <strong>${otp}</strong></p>
    <p>This OTP expires in 10 minutes. Do not share it with anyone.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;
  await apiInstance.sendTransacEmail(sendSmtpEmail);
}
