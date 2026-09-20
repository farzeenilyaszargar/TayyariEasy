"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function AccountEntryLink({ className }: { className: string }) {
  const { isLoggedIn } = useAuth();

  return (
    <Link href={isLoggedIn ? "/home" : "/auth?next=/home"} className={className}>
      {isLoggedIn ? "Dashboard" : "Sign in"}
    </Link>
  );
}
