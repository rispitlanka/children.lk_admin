import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Children.lk",
  description: "Request OTP to reset your password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
