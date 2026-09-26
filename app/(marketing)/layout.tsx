import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_HREF, faqs, features, footer, steps } from "./about/content";

// The frame for marketing pages: a header and a footer, and none of the app (no tab bar, no
// saved data, no intro). The folder name in brackets is a route group, so it is not in the URL.

const NAV = [
  { href: `#${steps.id}`, label: "How it works" },
  { href: `#${features.id}`, label: "Features" },
  { href: `#${faqs.id}`, label: "FAQ" },
];

/** The three status colors as a small mark beside the name, until there is a real logo. */
function Wordmark() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span aria-hidden className="flex gap-0.5">
        <span className="size-2.5 rounded-full bg-green-500" />
        <span className="size-2.5 rounded-full bg-yellow-400" />
        <span className="size-2.5 rounded-full bg-red-500" />
      </span>
      Sincewhen
    </span>
  );
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/about">
            <Wordmark />
          </Link>
          <nav aria-label="Page sections" className="hidden flex-1 gap-5 text-sm text-muted-foreground sm:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          <Link href={APP_HREF} className={cn(buttonVariants({ size: "lg" }), "ml-auto px-4 sm:ml-0")}>
            Open app
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <p>Free. No account, no ads, no tracking.</p>
          <p>
            <a href={footer.madeByHref} className="underline underline-offset-4 hover:text-foreground">
              {footer.madeBy}
            </a>
            {" · "}version {process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </div>
      </footer>
    </div>
  );
}
