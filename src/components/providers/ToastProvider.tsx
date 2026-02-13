"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 999999 }}
      toastOptions={{
        duration: 4000,
        success: {
          style: {
            background: "#12b76a",
            color: "#fff",
            border: "none",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#12b76a",
          },
        },
        error: {
          style: {
            background: "#f04438",
            color: "#fff",
            border: "none",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#f04438",
          },
        },
      }}
    />
  );
}
