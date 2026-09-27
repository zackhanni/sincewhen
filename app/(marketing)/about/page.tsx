import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { InstallSteps } from "@/components/app/install-steps";
import { buttonVariants } from "@/components/ui/button";
import { SITE_HOST, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  APP_HREF,
  faqs,
  features,
  finalCta,
  hero,
  install,
  maker,
  privacy,
  problems,
  screens,
  steps,
  useCases,
} from "./content";

// The promotional landing page: what Sincewhen is and why to use it. A first draft to be
// redesigned later — the layout is deliberately plain, and all the words live in content.ts.

const DESCRIPTION =
  "A free app for recurring chores. Each task comes due a set time after you last did it, and colors show what needs doing. No account, works offline.";

export const metadata: Metadata = {
  title: "Sincewhen: for the things you do every so often",
  description: DESCRIPTION,
  // One address for this page in search results (resolved against metadataBase in app/layout.tsx).
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Sincewhen: for the things you do every so often",
    description: "Recurring chores that come due based on when you last did them. Free, private, works offline.",
    url: "/about",
    siteName: "Sincewhen",
    type: "website",
  },
};

/**
 * A phone-shaped frame around a real screenshot, in the visitor's own theme. Below the hero,
 * both variants stay lazy, so only the visible one loads (a hidden lazy image is never fetched).
 *
 * The hero pair is eager with a high fetch priority instead. It is the page's largest paint, and
 * a lazy image is only requested after layout: measured on mobile, eager took the page from 96 to
 * 99 and its largest paint from 2.7 s to 2.3 s. The cost is the hidden twin downloading too
 * (about 13 KB). See docs/pagespeed-audit.md.
 */
function PhoneShot({ image, alt, isHero = false }: { image: string; alt: string; isHero?: boolean }) {
  const shared = {
    width: 390,
    height: 844,
    sizes: "(min-width: 640px) 280px, 70vw",
    fetchPriority: isHero ? ("high" as const) : undefined,
    loading: isHero ? ("eager" as const) : undefined,
  };
  return (
    <div className="mx-auto w-full max-w-70 overflow-hidden rounded-[2.25rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl dark:border-neutral-700">
      <Image src={`/landing/${image}-light.png`} alt={alt} {...shared} className="block dark:hidden" />
      <Image src={`/landing/${image}-dark.png`} alt={alt} {...shared} className="hidden dark:block" />
    </div>
  );
}

function Section({ id, title, subtitle, children, muted = false }: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    // scroll-mt keeps the sticky header from covering a section's title when a nav link jumps to it.
    <section id={id} className={cn("scroll-mt-16 px-4 py-16 sm:py-24", muted && "bg-muted/50")}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        {subtitle && <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{subtitle}</p>}
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  );
}

function OpenAppButton({ label }: { label: string }) {
  return (
    <Link href={APP_HREF} className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}>
      {label}
      <ArrowRightIcon />
    </Link>
  );
}

/**
 * Structured data: tells search engines this page is about a free web app, and who made it.
 * Every value comes from constants on this page or in content.ts, so it cannot drift from what
 * the page says.
 */
const APP_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Sincewhen",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: maker.name, url: maker.url },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Escaping "<" keeps the JSON from ever closing the script tag (Next.js JSON-LD guide).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_JSON_LD).replace(/</g, "\\u003c") }}
      />
      {/* Hero */}
      <section className="px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col items-start gap-5">
            <p className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">{hero.eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">{hero.title}</h1>
            <p className="max-w-xl text-lg text-muted-foreground">{hero.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <OpenAppButton label={hero.primaryCta} />
              <a href={`#${steps.id}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-6 text-base")}>
                {hero.secondaryCta}
              </a>
            </div>
            <p className="text-sm text-muted-foreground">{hero.note}</p>
          </div>
          <PhoneShot image="folders" alt={screens.items[0].alt} isHero />
        </div>
      </section>

      {/* The problem */}
      <Section title={problems.title} muted>
        <div className="grid gap-6 md:grid-cols-3">
          {problems.items.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id={steps.id} title={steps.title}>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.items.map((item, position) => (
            <li key={item.title} className="flex flex-col gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background">
                {position + 1}
              </span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Screenshots */}
      <Section title={screens.title} muted>
        <div className="grid gap-12 md:grid-cols-3">
          {screens.items.map((item) => (
            <figure key={item.image} className="flex flex-col gap-5">
              <PhoneShot image={item.image} alt={item.alt} />
              <figcaption className="text-center">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-muted-foreground">{item.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section id={features.id} title={features.title}>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <Icon aria-hidden className="mt-0.5 size-6 shrink-0" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Use cases */}
      <Section title={useCases.title} subtitle={useCases.subtitle} muted>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon aria-hidden className="size-6" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Privacy */}
      <Section title={privacy.title}>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <p className="text-lg text-muted-foreground">{privacy.body}</p>
          <ul className="flex flex-col gap-2 text-left sm:flex-row sm:gap-6">
            {privacy.points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckIcon aria-hidden className="size-5 text-green-600 dark:text-green-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Install */}
      <Section id={install.id} title={install.title} subtitle={install.body} muted>
        <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-6 rounded-xl border bg-card p-6">
            <InstallSteps />
            <div>
              <OpenAppButton label={hero.primaryCta} />
            </div>
          </div>
          {/* Only on wider screens: someone on a phone is already where they need to be. */}
          <figure className="hidden flex-col items-center gap-3 md:flex">
            {/* Always black on white, even in dark mode: a camera needs the contrast. */}
            <Image
              src="/qr-code.svg"
              unoptimized
              alt={`QR code for ${SITE_HOST}`}
              width={176}
              height={176}
              className="rounded-lg bg-white p-2"
            />
            <figcaption className="max-w-44 text-center text-sm text-muted-foreground">{install.qrCaption}</figcaption>
          </figure>
        </div>
      </Section>

      {/* FAQ: plain <details>, so it needs no JavaScript. */}
      <Section id={faqs.id} title={faqs.title}>
        <div className="mx-auto flex max-w-3xl flex-col divide-y rounded-xl border">
          {faqs.items.map((item) => (
            <details key={item.question} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Final call to action */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl bg-foreground px-6 py-12 text-center text-background">
          <h2 className="text-3xl font-semibold tracking-tight">{finalCta.title}</h2>
          <p className="max-w-xl opacity-80">{finalCta.body}</p>
          <Link
            href={APP_HREF}
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-11 px-6 text-base")}
          >
            {finalCta.cta}
            <ArrowRightIcon />
          </Link>
        </div>
      </section>
    </>
  );
}
