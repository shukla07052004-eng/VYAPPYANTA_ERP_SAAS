

"use client";

import App from "@/components/layout/ProtectedAppShell";
import './protected.css'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="protected-layout">

      <App>
        {children}
      </App>

    </div>
  );
}
