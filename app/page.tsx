import { redirect } from "next/navigation";

// There is no marketing page yet; the app starts at sign-up.
export default function RootPage() {
  redirect("/signup");
}
