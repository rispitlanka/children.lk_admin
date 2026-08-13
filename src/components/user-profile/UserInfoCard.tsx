"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    closeModal();
  };
  return (
    <div className="p-5 border border-gray-200 rounded-[10px] bg-white dark:border-gray-800 dark:bg-gray-dark lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Musharof
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Chowdhury
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                randomuser@pimjo.com
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                +09 363 398 46
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Bio
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Team Manager
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={openModal}>
          Edit
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[640px] m-4">
        <div className="relative w-full overflow-y-auto rounded-[12px] border border-gray-200 bg-white p-6 shadow-none dark:border-gray-800 dark:bg-gray-dark">
          <div className="mb-6 pr-10">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Personal Information
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h5 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <Label>First Name</Label>
                    <Input type="text" defaultValue="Musharof" />
                  </div>

                  <div>
                    <Label>Last Name</Label>
                    <Input type="text" defaultValue="Chowdhury" />
                  </div>

                  <div>
                    <Label>Email Address</Label>
                    <Input type="text" defaultValue="randomuser@pimjo.com" />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input type="text" defaultValue="+09 363 398 46" />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" defaultValue="Team Manager" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 mt-6 dark:border-gray-800">
              <Button size="sm" variant="outline" type="button" onClick={closeModal} className="h-10 px-4 text-xs">
                Cancel
              </Button>
              <Button size="sm" type="submit" className="h-10 px-4 text-xs">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
