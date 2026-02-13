"use client";

import toast from "react-hot-toast";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to send OTP";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
      setSent(true);
      toast.success("OTP sent to your email");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <div className="mb-6 flex justify-center lg:justify-start">
            <Link href="/">
              <Image
                src="https://res.cloudinary.com/dr3dhkvwq/image/upload/v1770911582/childrenlk/super-hero/ngvkzgdhmmzdreyviuxx.png"
                alt="Children.lk Logo"
                width={180}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to Sign In
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <p className="text-success-500 font-medium">
            If an account exists for {email}, we sent an OTP. Check your inbox and use it on the
            reset password page.
          </p>
          <Link href="/reset-password" className="mt-4 text-brand-500 hover:underline">
            Enter OTP and new password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <div className="mb-6 flex justify-center lg:justify-start">
          <Link href="/">
            <Image
              src="/images/logo/children.svg"
              alt="Children.lk Logo"
              width={180}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
        </div>
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to Sign In
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we&apos;ll send you an OTP to reset your password.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {error && <p className="text-sm text-error-500">{error}</p>}
            <div>
              <Label>Email <span className="text-error-500">*</span></Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="sm" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </div>
        </form>
        <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/reset-password" className="text-brand-500 hover:underline">
            Already have an OTP? Reset password
          </Link>
        </p>
      </div>
    </div>
  );
}
