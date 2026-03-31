import React from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex">
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
