import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Children.lk",
  description: "Sign up for a new Children.lk account",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
