"use client";

import { cn } from "@/lib/utils";
import { SignUp } from "@clerk/nextjs";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)} {...props}>
      <SignUp routing="hash" />
    </div>
  );
}
