"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
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
  const { update } = useSession();
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- modal form reset on open; gated on isOpen change, no cascade risk
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

      await update({
        name: form.name.trim(),
        image: form.avatar?.trim() || defaultAvatar,
      });
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
      <div className="space-y-8">
        <PageBreadcrumb pageTitle="Profile" />
        <div className="p-5 border border-gray-200 rounded-[10px] bg-white dark:border-gray-800 dark:bg-gray-dark lg:p-6">
          <LoadingLottie variant="block" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-8">
        <PageBreadcrumb pageTitle="Profile" />
        <div className="p-5 border border-gray-200 rounded-[10px] bg-white dark:border-gray-800 dark:bg-gray-dark lg:p-6">
          <p className="text-center py-12 text-gray-500 dark:text-gray-400">Failed to load profile.</p>
        </div>
      </div>
    );
  }

  const avatarSrc = profile.avatar?.startsWith("http") ? profile.avatar : defaultAvatar;

  return (
    <div className="space-y-8">
      <PageBreadcrumb pageTitle="Profile" />
      <div className="p-5 border border-gray-200 rounded-[10px] bg-white dark:border-gray-800 dark:bg-gray-dark lg:p-6">
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
          <Button variant="outline" onClick={openModal}>
            Edit
          </Button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-[10px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark lg:p-11">
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
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
