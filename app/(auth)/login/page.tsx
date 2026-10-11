import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <AuthCard mode="login" />;
}
