"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: { padding: "12px 16px", borderRadius: 8 },
        success: { duration: 3000 },
        error: { duration: 5000 },
      }}
    />
  );
}
