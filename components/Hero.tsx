import Image from "next/image";

import { site } from "@/data/site";

export function Hero() {
  return (
    <section id="top" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-[1100px] px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <Image
          src={site.avatar.src}
          alt={site.avatar.alt}
          width={64}
          height={64}
          priority
          className="size-16 rounded-full border border-line"
        />
        <h1 className="mt-8 text-5xl font-semibold tracking-tight md:text-7xl">
          sheepex_
        </h1>
        <p className="mt-5 text-lg text-muted md:text-xl">{site.tagline}</p>
        <p className="mt-3 max-w-md leading-relaxed text-muted">
          {site.description}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#art"
            className="bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-80"
          >
            view work
          </a>
          <a
            href="#links"
            className="border border-line px-6 py-3 text-sm font-medium transition-colors hover:border-ink"
          >
            all links
          </a>
        </div>
      </div>
    </section>
  );
}
