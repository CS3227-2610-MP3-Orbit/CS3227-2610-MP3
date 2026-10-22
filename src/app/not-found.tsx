import Link from "next/link";

import { OrbitMark } from "@/components/orbit-mark";
import { buttonVariants } from "@/components/ui/button";

/**
 * Branded 404 (SH-07 identity). "/" sends a signed-in user to their own dashboard and anyone
 * else to /login, so one link works for every visitor without reading the session here.
 */
export default function NotFound() {
  return (
    <main className="flex w-full flex-1 items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <OrbitMark className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">This page doesn&apos;t exist or may have moved.</p>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Go to your dashboard
        </Link>
      </div>
    </main>
  );
}
