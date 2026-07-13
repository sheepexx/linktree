"use client";

import Image from "next/image";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Info,
  Shuffle,
  X,
} from "lucide-react";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { artwork } from "../../data/artwork";
import { links, type LinkId } from "../../data/links";
import type {
  ArtworkCategory,
  ArtworkEntry,
  LocalImageAsset,
} from "../../lib/content-types";

type GalleryView = "grid" | "scrapbook";
type CopyState = "idle" | "copied" | "failed";

type ArtGalleryProps = {
  items?: readonly ArtworkEntry<LinkId>[];
  initialArtworkId?: string | null;
};

type ArtworkImageProps = {
  asset: LocalImageAsset;
  sizes: string;
  fit?: "cover" | "contain";
  dimmed?: boolean;
  hideFromAssistiveTech?: boolean;
  eager?: boolean;
};

const HASH_PREFIX = "#artwork-";
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const scrapbookAngles = [-1.4, 0.8, -0.5, 1.2, -0.9, 0.45];

function isSvg(src: string) {
  return src.split("?", 1)[0].toLowerCase().endsWith(".svg");
}

function safeDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function imageLinkFor(item: ArtworkEntry<LinkId>) {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  url.hash = `${HASH_PREFIX.slice(1)}${encodeURIComponent(item.id)}`;
  return url.toString();
}

function artworkIdFromHash(hash: string) {
  if (!hash.startsWith(HASH_PREFIX)) return null;

  try {
    return decodeURIComponent(hash.slice(HASH_PREFIX.length));
  } catch {
    return null;
  }
}

async function copyTextWithFallback(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.readOnly = true;
  textArea.style.position = "fixed";
  textArea.style.inset = "0 auto auto -9999px";
  document.body.appendChild(textArea);
  textArea.select();

  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) throw new Error("Copy command was unavailable");
}

function ArtworkImage({
  asset,
  sizes,
  fit = "cover",
  dimmed = false,
  hideFromAssistiveTech = false,
  eager = false,
}: ArtworkImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={hideFromAssistiveTech ? "content-note image preview unavailable" : `${asset.alt} (preview unavailable)`}
        className="absolute inset-0 grid place-items-center bg-[var(--panel-soft)] p-6 text-center"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--quiet)]">
          image unavailable
        </span>
      </div>
    );
  }

  return (
    <>
      {!loaded ? (
        <div
          aria-hidden="true"
          className="checkerboard absolute inset-0 overflow-hidden"
        >
          <span className="loading-step absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_13%,transparent),transparent)]" />
        </div>
      ) : null}
      <Image
        fill
        src={asset.src}
        alt={hideFromAssistiveTech ? "" : asset.alt}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        unoptimized={isSvg(asset.src)}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${fit === "cover" ? "object-cover" : "object-contain"} transition-[opacity,filter,transform] duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${dimmed ? "scale-[1.04] blur-xl brightness-[0.35]" : ""}`}
      />
    </>
  );
}

function ArtworkCard({
  item,
  index,
  view,
  onOpen,
  reducedMotion,
}: {
  item: ArtworkEntry<LinkId>;
  index: number;
  view: GalleryView;
  onOpen: (id: string) => void;
  reducedMotion: boolean;
}) {
  const isPlaceholder = item.image.placeholder || item.status === "placeholder";
  const cardDescriptionId = `art-card-${safeDomId(item.id)}`;
  const scrapbookAngle = scrapbookAngles[index % scrapbookAngles.length];

  return (
    <motion.article
      layout="position"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: view === "scrapbook" && !reducedMotion ? scrapbookAngle : 0,
      }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      whileHover={
        reducedMotion
          ? undefined
          : { y: -3, rotate: view === "scrapbook" ? 0 : undefined }
      }
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
      className={`group relative w-full break-inside-avoid border border-[var(--line)] bg-[var(--panel)] shadow-[3px_3px_0_var(--shadow)] transition-[border-color,box-shadow] hover:border-[var(--line-bright)] hover:shadow-[5px_5px_0_var(--shadow)] ${view === "grid" ? "mb-4" : "p-2 even:mt-5 sm:even:mt-10"}`}
    >
      {view === "scrapbook" ? (
        <span
          aria-hidden="true"
          className="absolute -top-2 left-1/2 z-10 h-4 w-14 -translate-x-1/2 border-x border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_28%,transparent)]"
        />
      ) : null}

      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-label={`Open ${item.title} in full-screen viewer`}
        aria-describedby={cardDescriptionId}
        className="block w-full text-left"
      >
        <span
          className="checkerboard relative block w-full overflow-hidden border-b border-[var(--line)]"
          style={{ aspectRatio: item.aspectRatio }}
        >
          <ArtworkImage
            asset={item.image}
            sizes="(max-width: 639px) calc(100vw - 3rem), (max-width: 1279px) 42vw, 28vw"
            dimmed={Boolean(item.contentWarning)}
            hideFromAssistiveTech={Boolean(item.contentWarning)}
            eager={index === 0}
          />

          <span className="absolute inset-x-2 top-2 flex flex-wrap items-start justify-between gap-2">
            <span className="border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas-deep)_88%,transparent)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] backdrop-blur-sm">
              {item.category}
            </span>
            {isPlaceholder ? (
              <span className="border border-[var(--warning)] bg-[var(--canvas-deep)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--warning)]">
                placeholder
              </span>
            ) : item.unfinished ? (
              <span className="border border-[var(--warning)] bg-[var(--canvas-deep)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--warning)]">
                unfinished
              </span>
            ) : null}
          </span>

          {item.contentWarning ? (
            <span className="absolute inset-0 grid place-items-center p-4 text-center">
              <span className="border border-[var(--line-bright)] bg-[color-mix(in_srgb,var(--canvas-deep)_92%,transparent)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink)]">
                content note · open to review
              </span>
            </span>
          ) : null}
        </span>

        <span className="block p-3 sm:p-4">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-[0.95rem] font-semibold text-[var(--ink)]">
                {item.title}
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--quiet)]">
                {item.date ?? "date not added"} · {item.status}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="mt-1 text-[var(--quiet)] transition-transform group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </span>

          <span
            id={cardDescriptionId}
            className="mt-3 block text-sm leading-6 text-[var(--muted)]"
          >
            {item.description}
          </span>

          {isPlaceholder ? (
            <span className="mt-3 block border-l-2 border-[var(--warning)] pl-2 font-mono text-[9px] uppercase leading-4 tracking-[0.08em] text-[var(--warning)]">
              empty archive slot · replace with a manually added image
            </span>
          ) : null}
        </span>
      </button>
    </motion.article>
  );
}

function MetadataList({ item }: { item: ArtworkEntry<LinkId> }) {
  const isPlaceholder =
    item.image.placeholder ||
    item.fullResolutionImage.placeholder ||
    item.status === "placeholder";

  return (
    <dl className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-x-3 gap-y-3 text-xs">
      <dt className="font-mono uppercase tracking-[0.08em] text-[var(--quiet)]">
        category
      </dt>
      <dd className="min-w-0 text-[var(--ink)]">{item.category}</dd>

      <dt className="font-mono uppercase tracking-[0.08em] text-[var(--quiet)]">
        date
      </dt>
      <dd className="min-w-0 text-[var(--ink)]">
        {item.date ? <time dateTime={item.date}>{item.date}</time> : "not added"}
      </dd>

      <dt className="font-mono uppercase tracking-[0.08em] text-[var(--quiet)]">
        status
      </dt>
      <dd className="min-w-0 text-[var(--ink)]">
        {isPlaceholder ? "placeholder — no artwork attached" : item.status}
        {item.unfinished && !isPlaceholder ? " · unfinished" : ""}
      </dd>

      <dt className="font-mono uppercase tracking-[0.08em] text-[var(--quiet)]">
        software
      </dt>
      <dd className="min-w-0 text-[var(--ink)]">
        {item.software.length ? item.software.join(" · ") : "not listed"}
      </dd>
    </dl>
  );
}

function GalleryLightbox({
  item,
  itemIndex,
  itemCount,
  onClose,
  onPrevious,
  onNext,
  revealed,
  onReveal,
}: {
  item: ArtworkEntry<LinkId>;
  itemIndex: number;
  itemCount: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  revealed: boolean;
  onReveal: () => void;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [showInfo, setShowInfo] = useState(true);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const goPrevious = useCallback(() => {
    setZoom(MIN_ZOOM);
    setCopyState("idle");
    onPrevious();
  }, [onPrevious]);
  const goNext = useCallback(() => {
    setZoom(MIN_ZOOM);
    setCopyState("idle");
    onNext();
  }, [onNext]);
  const actionRef = useRef({ onClose, onNext: goNext, onPrevious: goPrevious });
  const externalLink = item.externalLinkId ? links[item.externalLinkId] : null;
  const imageIsPlaceholder =
    item.fullResolutionImage.placeholder || item.status === "placeholder";

  useEffect(() => {
    actionRef.current = { onClose, onNext: goNext, onPrevious: goPrevious };
  }, [goNext, goPrevious, onClose]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        actionRef.current.onClose();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        actionRef.current.onPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        actionRef.current.onNext();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, []);

  const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleCopy = async () => {
    try {
      await copyTextWithFallback(imageLinkFor(item));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[300] bg-[color-mix(in_srgb,var(--canvas-deep)_96%,transparent)] p-1.5 backdrop-blur-sm sm:p-3 lg:p-5"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.16 }}
      onMouseDown={handleBackdropClick}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="art-lightbox-title"
        aria-describedby="art-lightbox-description"
        tabIndex={-1}
        className="mx-auto flex h-full min-h-0 max-w-[96rem] flex-col overflow-hidden border border-[var(--line-bright)] bg-[var(--canvas)] shadow-[7px_7px_0_var(--shadow)]"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 4 }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
      >
        <header className="flex min-h-14 flex-none items-center gap-2 border-b border-[var(--line)] bg-[var(--panel)] px-2 sm:px-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close artwork viewer"
            title="Close (Escape)"
            className="grid size-10 flex-none place-items-center border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
          >
            <X aria-hidden="true" size={17} strokeWidth={1.7} />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p
              id="art-lightbox-title"
              className="truncate text-sm font-semibold text-[var(--ink)]"
            >
              {item.title}
            </p>
            <p id="art-lightbox-description" className="sr-only">
              {item.description}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--quiet)]">
              {itemIndex + 1} / {itemCount} · {Math.round(zoom * 100)}%
            </p>
          </div>

          <div
            className="flex flex-none items-center gap-1"
            role="group"
            aria-label="Zoom controls"
          >
            <button
              type="button"
              onClick={() =>
                setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))
              }
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              title="Zoom out"
              className="grid size-10 place-items-center border border-[var(--line)] bg-[var(--panel-soft)] font-mono text-base text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              −
            </button>
            <button
              type="button"
              onClick={() =>
                setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))
              }
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              title="Zoom in"
              className="grid size-10 place-items-center border border-[var(--line)] bg-[var(--panel-soft)] font-mono text-base text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowInfo((visible) => !visible)}
            aria-label={showInfo ? "Hide image information" : "Show image information"}
            aria-pressed={showInfo}
            title="Image information"
            className="grid size-10 flex-none place-items-center border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]"
          >
            <Info aria-hidden="true" size={17} strokeWidth={1.7} />
          </button>
        </header>

        <div className="relative grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-h-0 overflow-hidden">
            <div className="checkerboard absolute inset-0 overflow-auto overscroll-contain">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={item.id}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.18 }}
                  className="relative min-h-full min-w-full"
                  style={{
                    width: `${zoom * 100}%`,
                    height: `${zoom * 100}%`,
                  }}
                >
                  <ArtworkImage
                    key={item.fullResolutionImage.src}
                    asset={item.fullResolutionImage}
                    sizes="100vw"
                    fit="contain"
                    dimmed={Boolean(item.contentWarning && !revealed)}
                    hideFromAssistiveTech={Boolean(item.contentWarning && !revealed)}
                    eager
                  />

                  {imageIsPlaceholder ? (
                    <span className="absolute left-3 top-3 border border-[var(--warning)] bg-[var(--canvas-deep)] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--warning)]">
                      placeholder preview · no artwork attached
                    </span>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              {item.contentWarning && !revealed ? (
                <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--canvas-deep)_42%,transparent)] p-6">
                  <div className="max-w-sm border border-[var(--line-bright)] bg-[var(--panel)] p-5 text-center shadow-[4px_4px_0_var(--shadow)]">
                    <p className="pixel-label text-[var(--warning)]">content note</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink)]">
                      {item.contentWarning}
                    </p>
                    <button
                      type="button"
                      onClick={onReveal}
                      className="mt-5 min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--canvas-deep)] hover:brightness-110"
                    >
                      show image
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {itemCount > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="Previous artwork"
                  title="Previous artwork (Left arrow)"
                  className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center border border-[var(--line-bright)] bg-[color-mix(in_srgb,var(--canvas-deep)_88%,transparent)] text-[var(--ink)] shadow-[2px_2px_0_var(--shadow)] backdrop-blur-sm transition-transform hover:-translate-x-0.5 sm:left-3"
                >
                  <ChevronLeft aria-hidden="true" size={21} strokeWidth={1.7} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next artwork"
                  title="Next artwork (Right arrow)"
                  className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center border border-[var(--line-bright)] bg-[color-mix(in_srgb,var(--canvas-deep)_88%,transparent)] text-[var(--ink)] shadow-[2px_2px_0_var(--shadow)] backdrop-blur-sm transition-transform hover:translate-x-0.5 sm:right-3"
                >
                  <ChevronRight aria-hidden="true" size={21} strokeWidth={1.7} />
                </button>
              </>
            ) : null}
          </div>

          <AnimatePresence initial={false}>
            {showInfo ? (
              <motion.aside
                key="image-information"
                aria-label="Artwork information"
                initial={reducedMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: reducedMotion ? 0 : 0.18 }}
                className="soft-scrollbar absolute inset-x-0 bottom-0 z-20 max-h-[48%] overflow-y-auto border-t border-[var(--line-bright)] bg-[color-mix(in_srgb,var(--panel)_97%,transparent)] p-4 shadow-[0_-4px_0_var(--shadow)] backdrop-blur-md md:static md:z-auto md:h-full md:max-h-none md:w-80 md:border-l md:border-t-0 md:shadow-none lg:w-96 lg:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="pixel-label text-[var(--accent)]">image info</p>
                    <h2 className="mt-2 text-xl font-semibold leading-tight text-[var(--ink)]">
                      {item.title}
                    </h2>
                  </div>
                  <span className="border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--muted)]">
                    {item.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>

                <div className="my-5 h-px bg-[var(--line)]" />
                <MetadataList item={item} />

                {item.tags.length ? (
                  <div className="mt-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--quiet)]">
                      tags
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Artwork tags">
                      {item.tags.map((tag) => (
                        <li
                          key={tag}
                          className="border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 font-mono text-[9px] text-[var(--muted)]"
                        >
                          #{tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {item.contentWarning ? (
                  <div className="mt-5 border-l-2 border-[var(--warning)] pl-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--warning)]">
                      content note
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {item.contentWarning}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex min-h-11 items-center justify-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
                  >
                    <Copy aria-hidden="true" size={14} strokeWidth={1.7} />
                    {copyState === "copied" ? "copied" : "copy link"}
                  </button>

                  {item.downloadEnabled ? (
                    <a
                      href={item.fullResolutionImage.src}
                      download
                      className="flex min-h-11 items-center justify-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)]"
                    >
                      <Download aria-hidden="true" size={14} strokeWidth={1.7} />
                      download
                    </a>
                  ) : null}

                  {externalLink ? (
                    <a
                      href={externalLink.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center justify-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)] sm:col-span-2 md:col-span-1 lg:col-span-2"
                    >
                      <ExternalLink aria-hidden="true" size={14} strokeWidth={1.7} />
                      open on {externalLink.platform}
                    </a>
                  ) : null}
                </div>

                <p className="mt-3 min-h-5 font-mono text-[9px] leading-5 text-[var(--quiet)]" role="status" aria-live="polite">
                  {copyState === "copied"
                    ? "artwork link copied to clipboard"
                    : copyState === "failed"
                      ? "could not copy — use the browser address bar"
                      : item.downloadEnabled
                        ? "download enabled by the archive owner"
                        : "download not enabled for this entry"}
                </p>
              </motion.aside>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ArtGallery({
  items = artwork,
  initialArtworkId = null,
}: ArtGalleryProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [view, setView] = useState<GalleryView>("grid");
  const [category, setCategory] = useState<ArtworkCategory | "all">("all");
  const [tag, setTag] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(initialArtworkId);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const portalReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items],
  );
  const tags = useMemo(
    () =>
      Array.from(new Set(items.flatMap((item) => [...item.tags]))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (category === "all" || item.category === category) &&
          (tag === "all" || item.tags.includes(tag)),
      ),
    [category, items, tag],
  );

  const activeItem = activeId
    ? items.find((item) => item.id === activeId) ?? null
    : null;
  const lightboxItems =
    activeItem && filteredItems.some((item) => item.id === activeItem.id)
      ? filteredItems
      : items;
  const activeIndex = activeItem
    ? lightboxItems.findIndex((item) => item.id === activeItem.id)
    : -1;

  useEffect(() => {
    const openLinkedArtwork = () => {
      const linkedId = artworkIdFromHash(window.location.hash);
      if (linkedId && items.some((item) => item.id === linkedId)) {
        setActiveId(linkedId);
      }
    };

    openLinkedArtwork();
    window.addEventListener("hashchange", openLinkedArtwork);
    return () => window.removeEventListener("hashchange", openLinkedArtwork);
  }, [items]);

  const closeLightbox = useCallback(() => setActiveId(null), []);
  const showPrevious = useCallback(() => {
    if (!lightboxItems.length || activeIndex < 0) return;
    const previousIndex =
      (activeIndex - 1 + lightboxItems.length) % lightboxItems.length;
    setActiveId(lightboxItems[previousIndex].id);
  }, [activeIndex, lightboxItems]);
  const showNext = useCallback(() => {
    if (!lightboxItems.length || activeIndex < 0) return;
    const nextIndex = (activeIndex + 1) % lightboxItems.length;
    setActiveId(lightboxItems[nextIndex].id);
  }, [activeIndex, lightboxItems]);

  const openRandomArtwork = () => {
    if (!filteredItems.length) return;
    const nextIndex = Math.floor(Math.random() * filteredItems.length);
    setActiveId(filteredItems[nextIndex].id);
  };

  const resetFilters = () => {
    setCategory("all");
    setTag("all");
  };

  return (
    <section aria-label="Artwork archive">
      <div className="window-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] bg-[var(--panel)] p-3 sm:p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.11em] text-[var(--quiet)]">
                category
              </span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ArtworkCategory | "all")
                }
                className="min-h-11 w-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm text-[var(--ink)] hover:border-[var(--line-bright)]"
              >
                <option value="all">all categories</option>
                {categories.map((entryCategory) => (
                  <option key={entryCategory} value={entryCategory}>
                    {entryCategory}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.11em] text-[var(--quiet)]">
                tag
              </span>
              <select
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                className="min-h-11 w-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-sm text-[var(--ink)] hover:border-[var(--line-bright)]"
              >
                <option value="all">all tags</option>
                {tags.map((entryTag) => (
                  <option key={entryTag} value={entryTag}>
                    #{entryTag}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.11em] text-[var(--quiet)]">
                layout
              </span>
              <div
                className="flex border border-[var(--line)] bg-[var(--panel-soft)] p-0.5"
                role="group"
                aria-label="Gallery layout"
              >
                {(["grid", "scrapbook"] as const).map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => setView(layout)}
                    aria-pressed={view === layout}
                    className="min-h-10 px-3 font-mono text-[9px] uppercase tracking-[0.09em] text-[var(--muted)] hover:text-[var(--ink)] aria-pressed:bg-[var(--accent)] aria-pressed:text-[var(--canvas-deep)]"
                  >
                    {layout}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={openRandomArtwork}
              disabled={!filteredItems.length}
              className="flex min-h-11 items-center gap-2 border border-[var(--line)] bg-[var(--panel-soft)] px-3 font-mono text-[9px] uppercase tracking-[0.09em] text-[var(--muted)] hover:border-[var(--line-bright)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Shuffle aria-hidden="true" size={14} strokeWidth={1.7} />
              random
            </button>
          </div>
        </div>

        <div className="flex min-h-9 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 sm:px-4">
          <p
            className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--quiet)]"
            aria-live="polite"
          >
            showing {filteredItems.length} / {items.length} archive slots
          </p>
          {category !== "all" || tag !== "all" ? (
            <button
              type="button"
              onClick={resetFilters}
              className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent)] underline decoration-[var(--accent-soft)] underline-offset-4 hover:text-[var(--ink)]"
            >
              clear filters
            </button>
          ) : (
            <p className="hidden font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--quiet)] sm:block">
              arrows navigate viewer · esc closes
            </p>
          )}
        </div>

        <div className="bg-[var(--canvas)] p-3 sm:p-4 lg:p-5">
          {filteredItems.length ? (
            <LayoutGroup id="art-gallery-layout">
              <motion.div
                layout
                className={
                  view === "grid"
                    ? "columns-1 gap-4 sm:columns-2 2xl:columns-3"
                    : "grid grid-cols-1 gap-5 pb-3 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3"
                }
              >
                <AnimatePresence initial={false}>
                  {filteredItems.map((item, index) => (
                    <ArtworkCard
                      key={`${view}-${item.id}`}
                      item={item}
                      index={index}
                      view={view}
                      onOpen={setActiveId}
                      reducedMotion={reducedMotion}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>
          ) : (
            <div className="grid min-h-64 place-items-center border border-dashed border-[var(--line)] bg-[var(--panel-soft)] p-8 text-center">
              <div className="max-w-sm">
                <p className="pixel-label text-[var(--accent)]">0 files found</p>
                <h2 className="mt-3 text-lg font-semibold text-[var(--ink)]">
                  nothing in this filter
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  This combination has no archive slots yet. Clear the filters to see
                  everything currently listed.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 min-h-11 border border-[var(--accent)] px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--canvas-deep)]"
                >
                  clear filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {activeItem && activeIndex >= 0 ? (
                <GalleryLightbox
                  key="artwork-lightbox"
                  item={activeItem}
                  itemIndex={activeIndex}
                  itemCount={lightboxItems.length}
                  onClose={closeLightbox}
                  onPrevious={showPrevious}
                  onNext={showNext}
                  revealed={revealedIds.has(activeItem.id)}
                  onReveal={() =>
                    setRevealedIds((current) => {
                      const next = new Set(current);
                      next.add(activeItem.id);
                      return next;
                    })
                  }
                />
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </section>
  );
}
