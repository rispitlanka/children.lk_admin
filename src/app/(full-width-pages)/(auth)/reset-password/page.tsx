import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Children.lk",
  description: "Enter OTP and set new password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
