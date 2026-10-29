import { redirect } from "next/navigation";

// proxy.ts sends "/" to /app or /signup before this renders. This is only a fallback.
export default function RootPage() {
  redirect("/signup");
}
