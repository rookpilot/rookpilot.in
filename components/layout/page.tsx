import { cn } from "@/lib/utils";

/** Standard page padding and width inside the app shell. Fades up gently when it first appears. */
export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8",
        "animate-in duration-300 ease-out fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
