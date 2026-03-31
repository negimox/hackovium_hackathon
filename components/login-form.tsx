"use client";

import { cn } from "@/lib/utils";
import { SignIn } from "@clerk/nextjs";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)} {...props}>
      <SignIn routing="hash" />
    </div>
  );
}
