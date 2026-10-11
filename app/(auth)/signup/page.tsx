import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return <AuthCard mode="signup" />;
}
