import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
}

/** Rookpilot wordmark. Swaps between light and dark artwork with the theme. */
export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link href={href} aria-label="Rookpilot home" className={cn("inline-flex h-7 shrink-0", className)}>
      <Image src="/brand/logo-light.png" alt="Rookpilot" width={974} height={240} priority className="h-full w-auto dark:hidden" />
      <Image src="/brand/logo-dark.png" alt="Rookpilot" width={974} height={240} priority className="hidden h-full w-auto dark:block" />
    </Link>
  );
}

/** Just the rook icon from the wordmark, for tight spaces like the collapsed sidebar. */
export function LogoMark({ className, href = "/" }: LogoProps) {
  return (
    <Link href={href} aria-label="Rookpilot home" className={cn("inline-flex h-7 w-[26px] shrink-0 overflow-hidden", className)}>
      <Image src="/brand/logo-light.png" alt="" width={974} height={240} className="h-full w-auto max-w-none dark:hidden" />
      <Image src="/brand/logo-dark.png" alt="" width={974} height={240} className="hidden h-full w-auto max-w-none dark:block" />
    </Link>
  );
}
