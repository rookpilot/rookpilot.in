import { cn } from "@/lib/utils";

/** Standard page padding and width inside the app shell. */
export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8", className)} {...props} />;
}
