import SignInForm from "@/components/auth/SignInForm";
import LoadingLottie from "@/components/common/LoadingLottie";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In | Children.lk",
  description: "Sign in to your Children.lk account",
};

export default function SignIn() {
  return (
    <Suspense fallback={<LoadingLottie variant="full" />}>
      <SignInForm />
    </Suspense>
  );
}
