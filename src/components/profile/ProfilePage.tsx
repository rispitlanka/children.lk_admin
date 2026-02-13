"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import AvatarUpload from "@/components/form/AvatarUpload";
import LoadingLottie from "@/components/common/LoadingLottie";
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "@/lib/validation";

type ProfileData = {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: string;
};

const defaultAvatar = "/images/user/avatar-default.svg";

export default function ProfilePage() {
  const { isOpen, openModal, closeModal } = useModal();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", address: "", avatar: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = () => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          avatar: data.avatar ?? "",
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      setForm({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        avatar: profile.avatar ?? "",
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowError(false);
      setShowSuccess(false);
    }
  }, [isOpen, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setShowError(false);
  };

  const handleAddressChange = (value: string) => {
    setForm((prev) => ({ ...prev, address: value }));
    setShowError(false);
  };

  const handlePwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
    setShowError(false);
  };

  const validate = () => {
    if (!form.name.trim()) {
      const msg = "Name is required";
      setErrorMessage(msg);
      setShowError(true);
      toast.error(msg);
      return false;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      setErrorMessage(PHONE_VALIDATION_MESSAGE);
      setShowError(true);
      toast.error(PHONE_VALIDATION_MESSAGE);
      return false;
    }
    if (pwForm.newPassword) {
      if (!pwForm.currentPassword) {
        const msg = "Current password is required to change password";
        setErrorMessage(msg);
        setShowError(true);
        toast.error(msg);
        return false;
      }
      if (pwForm.newPassword.length < 6) {
        const msg = "New password must be at least 6 characters";
        setErrorMessage(msg);
        setShowError(true);
        toast.error(msg);
        return false;
      }
      if (pwForm.newPassword !== pwForm.confirmPassword) {
        const msg = "Passwords do not match";
        setErrorMessage(msg);
        setShowError(true);
        toast.error(msg);
        return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !profile) return;

    setSaving(true);
    setShowError(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          address: form.address || undefined,
          avatar: form.avatar || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to save";
        setErrorMessage(msg);
        setShowError(true);
        toast.error(msg);
        setSaving(false);
        return;
      }

      if (pwForm.newPassword) {
        const pwRes = await fetch("/api/profile/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: pwForm.currentPassword,
            newPassword: pwForm.newPassword,
          }),
        });
        const pwData = await pwRes.json();
        if (!pwRes.ok) {
          const msg = pwData.error ?? "Failed to change password";
          setErrorMessage(msg);
          setShowError(true);
          toast.error(msg);
          setSaving(false);
          return;
        }
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }

      setProfile((prev) => (prev ? { ...prev, ...form } : null));
      setShowSuccess(true);
      toast.success("Profile updated successfully");
      setTimeout(() => {
        setShowSuccess(false);
        closeModal();
      }, 1500);
    } catch {
      setErrorMessage("Something went wrong");
      setShowError(true);
      toast.error("Something went wrong");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Profile" />
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <LoadingLottie variant="block" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Profile" />
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <p className="text-center py-12 text-gray-500 dark:text-gray-400">Failed to load profile.</p>
        </div>
      </div>
    );
  }

  const avatarSrc = profile.avatar?.startsWith("http") ? profile.avatar : defaultAvatar;

  return (
    <div>
      <PageBreadcrumb pageTitle="Profile" />
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-8">
            <div className="flex flex-col items-center gap-4 xl:flex-row xl:items-center">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-center xl:text-left">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{profile.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              </div>
            </div>
            <div className="xl:border-l xl:border-gray-200 xl:pl-8 xl:dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-4">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.name}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email address</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.email}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.phone || "—"}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Address</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile.address || "—"}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          {showSuccess && (
            <div className="mb-6 px-2">
              <Alert
                variant="success"
                title="Success!"
                message="Profile updated successfully."
                showLink={false}
              />
            </div>
          )}
          {showError && (
            <div className="mb-6 px-2">
              <Alert
                variant="error"
                title="Error"
                message={errorMessage}
                showLink={false}
              />
            </div>
          )}
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">Avatar</h5>
                <div className="mb-6">
                  <AvatarUpload
                    label="Profile Picture"
                    value={form.avatar || profile.avatar}
                    onChange={(url) => setForm((prev) => ({ ...prev, avatar: url }))}
                    folder="avatars"
                  />
                </div>
              </div>

              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Name *</Label>
                    <Input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email address</Label>
                    <Input type="email" value={profile.email} disabled className="opacity-70" />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed.</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+94771234567"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      +94 followed by 9 digits
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <TextArea value={form.address} onChange={handleAddressChange} rows={3} />
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Change Password (Optional)
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      name="currentPassword"
                      value={pwForm.currentPassword}
                      onChange={handlePwChange}
                      placeholder="Enter current password to change password"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      name="newPassword"
                      value={pwForm.newPassword}
                      onChange={handlePwChange}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={pwForm.confirmPassword}
                      onChange={handlePwChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={saving}>
                Close
              </Button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
