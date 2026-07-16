"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Section } from "@/components/Section";
import { gallery, galleryDescription } from "@/data/gallery";

const filters = ["all", "art", "gfx"] as const;
type Filter = (typeof filters)[number];

export function GallerySection() {
  const [filter, setFilter] = useState<Filter>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visible =
    filter === "all"
      ? gallery
      : gallery.filter((item) => item.category === filter);
  const count = visible.length;
  const active = lightboxIndex === null ? null : visible[lightboxIndex];

  const close = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(
    () =>
      setLightboxIndex((index) =>
        index === null ? null : (index - 1 + count) % count,
      ),
    [count],
  );
  const showNext = useCallback(
    () =>
      setLightboxIndex((index) => (index === null ? null : (index + 1) % count)),
    [count],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") showPrev();
      else if (event.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, showPrev, showNext]);

  return (
    <Section id="art" title="art / gfx" description={galleryDescription}>
      <div className="flex gap-6" role="group" aria-label="gallery filters">
        {filters.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={filter === name}
            onClick={() => {
              setFilter(name);
              setLightboxIndex(null);
            }}
            className={
              filter === name
                ? "text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-8"
                : "text-sm text-muted transition-colors hover:text-ink"
            }
          >
            {name}
          </button>
        ))}
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => (
          <li key={item.id} className={item.wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group w-full text-left"
            >
              <span
                className="relative block overflow-hidden border border-line"
                style={{ aspectRatio: item.wide ? (item.aspect ?? "4 / 1") : "4 / 5" }}
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes={
                    item.wide
                      ? "(min-width: 1148px) 1100px, 100vw"
                      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  }
                  className="object-cover"
                />
              </span>
              <span className="mt-3 block text-sm font-medium">{item.title}</span>
              <span className="mt-1 block text-xs text-muted">{item.category}</span>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6 animate-[page-fade_0.2s_ease]"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-6 top-5 text-sm text-paper/80 transition-colors hover:text-paper"
          >
            close
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="previous image"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-3 text-2xl text-paper/80 transition-colors hover:text-paper md:left-8"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="next image"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-3 text-2xl text-paper/80 transition-colors hover:text-paper md:right-8"
              >
                →
              </button>
            </>
          )}
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl"
          >
            <div
              className="relative mx-auto max-h-[72vh] w-full"
              style={{ aspectRatio: active.aspect ?? "4 / 3" }}
            >
              <Image
                src={active.image.src}
                alt={active.image.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="mt-5 text-center">
              <p className="font-medium text-paper">{active.title}</p>
              {active.description && (
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-paper/70">
                  {active.description}
                </p>
              )}
              {active.href && (
                <a
                  href={active.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-paper underline underline-offset-4 transition-opacity hover:opacity-80"
                >
                  osu! profile ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
