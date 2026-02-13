"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";

export default function RequestOrganizerForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (phone.trim() && !isValidPhone(phone)) {
      setError(PHONE_VALIDATION_MESSAGE);
      toast.error(PHONE_VALIDATION_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/organizer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to submit";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
      setSuccess(true);
      toast.success("Request submitted successfully. We will get in touch.");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-success-500 font-medium">Request submitted successfully. We will get in touch.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4"
    >
      {error && <p className="text-sm text-error-500">{error}</p>}
      <div>
        <Label>Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
        />
      </div>
      <div>
        <Label>Email *</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+94771234567"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">+94 followed by 9 digits (optional)</p>
      </div>
      <div>
        <Label>Message</Label>
        <TextArea
          value={message}
          onChange={(v) => setMessage(v)}
          rows={4}
          placeholder="Why do you want to become an organizer?"
        />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}
