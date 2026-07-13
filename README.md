# SHEEPEX archive

A complete personal archive for the online identity **SHEEPEX / `sheepex_`**. It collects art, GFX, osu!mania material, videos, small web projects, and social links in a responsive Next.js site.

The visual language is a custom creative desktop rather than a portfolio template or an operating-system clone: charcoal surfaces, muted signal colours, file-browser rows, image-editor checkerboards, dithered details, compact monospace labels, and deliberately restrained motion. Desktop uses a persistent archive sidebar and window-like content panels; mobile turns the same material into touch-friendly, stacked views with a compact bottom navigation.

## Content policy: read this first

This repository intentionally ships with labelled placeholder graphics and manual data.

- Use only the public identities `sheepex_` and `sheepexosu`. Do not add a real name, location, private contact detail, or business identity to content or metadata.
- Do not invent or infer artwork, authorship, GFX, clients, collaborations, awards, statistics, rankings, achievements, project users, stars, downloads, followers, views, or testimonials.
- Replace placeholders only with files supplied or explicitly approved by the archive owner. Do not fill them with stock, scraped, random, or AI-generated art.
- Treat an unverified field as unknown: keep it `null`, an empty array, or an honest note. Never make the interface look complete by fabricating data.
- Keep every user-editable external URL in [`data/links.ts`](data/links.ts). Other data records reference typed link IDs such as `youtube` or `cascade`; do not scatter content URLs through components.
- The default status and media workflows are manual. Nothing scrapes Pixiv or X, fetches changing osu! statistics, embeds a social timeline, or connects Discord, Spotify, or Last.fm.

## Features

- Separate routes for home, art, GFX, osu!, videos, projects, links, and the optional `???` folder
- Filterable art gallery with grid/scrapbook views, random selection, an accessible lightbox, zoom, copy-link, keyboard navigation, and owner-controlled downloads
- GFX contact-sheet, list, and file-browser views
- Privacy-gated YouTube and Bilibili players that load only after an explicit click
- Project archive and a centralized link directory with no live vanity metrics
- Decorative four-key rhythm/KPS interaction that is not required for navigation
- Command palette (`Ctrl`/`Cmd` + `K`), modifier-based section shortcuts, keyboard-friendly controls, and accessible secret-folder alternatives
- Default, night, pink, monochrome, and unlockable archive themes stored locally in the browser
- Static metadata, `robots.txt`, and sitemap generation based on the public online identity

## Project structure

Generated folders/files such as `.next/`, `node_modules/`, `next-env.d.ts`, and `*.tsbuildinfo` are intentionally omitted.

```text
linktree/
├── app/                         # Next.js App Router pages and global metadata
│   ├── art/page.tsx
│   ├── gfx/page.tsx
│   ├── links/page.tsx
│   ├── osu/page.tsx
│   ├── projects/page.tsx
│   ├── unknown/page.tsx
│   ├── videos/page.tsx
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── gallery/
│   │   ├── ArtGallery.tsx
│   │   └── GfxBrowser.tsx
│   ├── layout/
│   │   ├── CommandPalette.tsx
│   │   ├── SiteFooter.tsx
│   │   └── SiteShell.tsx
│   ├── links/LinkDirectory.tsx
│   ├── osu/RhythmLab.tsx
│   ├── projects/ProjectArchive.tsx
│   ├── unknown/SecretFolderExplorer.tsx
│   ├── videos/VideoDeck.tsx
│   └── ui/
│       ├── EmptyState.tsx
│       ├── ExternalAnchor.tsx
│       ├── IconButton.tsx
│       ├── PixelButton.tsx
│       ├── SectionIntro.tsx
│       ├── Tag.tsx
│       └── Window.tsx
├── data/                        # Manual content; no database or CMS required
│   ├── artwork.ts
│   ├── easter-eggs.ts
│   ├── gfx.ts
│   ├── index.ts
│   ├── links.ts                # Canonical home for all content URLs
│   ├── messages.ts
│   ├── navigation.ts
│   ├── osu.ts
│   ├── profile.ts
│   ├── projects.ts
│   ├── status.ts
│   ├── themes.ts
│   └── videos.ts
├── lib/
│   └── content-types.ts         # Shared content contracts and allowed values
├── public/
│   ├── art/
│   │   ├── artwork-placeholder-01.svg
│   │   ├── artwork-placeholder-02.svg
│   │   ├── artwork-placeholder-03.svg
│   │   ├── artwork-placeholder-04.svg
│   │   ├── artwork-placeholder-05.svg
│   │   └── artwork-placeholder-06.svg
│   ├── gfx/
│   │   ├── gfx-placeholder-01.svg
│   │   ├── gfx-placeholder-02.svg
│   │   ├── gfx-placeholder-03.svg
│   │   ├── gfx-placeholder-04.svg
│   │   └── gfx-placeholder-05.svg
│   ├── icons/
│   │   ├── file-image.svg
│   │   ├── folder.svg
│   │   └── play.svg
│   ├── projects/
│   │   ├── project-screenshot-placeholder-01.svg
│   │   ├── project-screenshot-placeholder-02.svg
│   │   ├── project-screenshot-placeholder-03.svg
│   │   ├── project-screenshot-placeholder-04.svg
│   │   └── project-screenshot-placeholder-05.svg
│   ├── textures/tile-grid.svg
│   ├── videos/
│   │   ├── video-thumbnail-placeholder-01.svg
│   │   ├── video-thumbnail-placeholder-02.svg
│   │   ├── video-thumbnail-placeholder-03.svg
│   │   └── video-thumbnail-placeholder-04.svg
│   ├── avatar-placeholder.svg
│   ├── social-preview-placeholder.svg
│   └── social-preview-placeholder.png
├── .gitignore
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## Requirements and commands

- Node.js **20.9 or newer**
- npm (the committed lockfile is the source of reproducible versions)

Install and run the development server:

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. On Windows PowerShell, `npm.cmd ci` and `npm.cmd run dev` are equivalent and can avoid script-alias policy issues.

Quality and production commands:

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

`start` serves the already-built production app and should be run after `build`. No database, authentication, CMS, API key, or environment file is required for the default site.

## Dependencies

Runtime dependencies:

| Package | Version | Purpose |
| --- | --- | --- |
| `next` | `16.2.10` | App Router, metadata, image optimization, and production server |
| `react` | `19.2.7` | Interface rendering |
| `react-dom` | `19.2.7` | Browser rendering |
| `framer-motion` | `12.42.2` | Page, dialog, and gallery transitions with reduced-motion handling |
| `lucide-react` | `1.24.0` | Small set of interface icons |

Development dependencies:

| Package | Version specification | Purpose |
| --- | --- | --- |
| `typescript` | `6.0.3` | Strict content and component type checking |
| `tailwindcss` | `4.3.2` | Utility CSS and design tokens |
| `@tailwindcss/postcss` | `4.3.2` | Tailwind PostCSS integration |
| `eslint` | `^9.0.0` | Static analysis |
| `eslint-config-next` | `16.2.10` | Next.js ESLint rules |
| `@types/node` | `^24.0.0` | Node.js types |
| `@types/react` | `^19.2.0` | React types |
| `@types/react-dom` | `^19.2.0` | React DOM types |

`package.json` also pins Next.js's transitive `postcss` package to `8.5.19` through an npm override; `package-lock.json` records the resolved dependency graph.

## Editing content and assets

Files placed in `public/` are served from the site root: `public/art/example.webp` is referenced as `/art/example.webp`. Prefer optimized WebP or AVIF for raster images, use descriptive filenames, and retain an original only when a full-resolution view or permitted download needs it.

After any content edit, run `npm run typecheck`. The contracts in [`lib/content-types.ts`](lib/content-types.ts) document allowed categories, statuses, and required fields.

### Avatar and social preview

1. Put the approved avatar in `public/`, for example `public/avatar.webp`.
2. In [`data/profile.ts`](data/profile.ts), update `avatar.src`, write useful identity-safe `avatar.alt` text, and set `avatar.placeholder` to `false`.
3. Replace the social card separately as a 1200x630 PNG, JPG, or WebP, then update `seo.socialPreview` in `data/profile.ts` and the Open Graph/Twitter image in `app/layout.tsx` if its filename changed. Keep the SVG only as an editable source if useful.

Do not use alt text or metadata to disclose a real name or claim authorship that has not been confirmed.

### Artwork

1. Add approved preview/full files under `public/art/`.
2. Replace or duplicate an entry in [`data/artwork.ts`](data/artwork.ts). Keep a unique `id`; fill `title`, `category`, `date`, `description`, `software`, `tags`, `status`, `unfinished`, and `aspectRatio` only from known information.
3. Point `image` and `fullResolutionImage` at the local files, provide meaningful alt text, and set both `placeholder` flags to `false`.
4. For an original post, add its URL to `data/links.ts` and use that key as `externalLinkId`.
5. Set `downloadEnabled: true` only when the owner explicitly permits downloading. Add the entry ID to `profile.featuredArtworkId` if it should appear on the home page.

Use `null` for unknown dates, links, or content warnings. Never turn a brief-supplied or publicly associated title into an authorship claim.

### GFX

1. Add approved previews/full files under `public/gfx/`.
2. Replace or duplicate a record in [`data/gfx.ts`](data/gfx.ts), preserving a unique `id` and a real `fileName`.
3. Update `previewImage`, `fullImage`, `type`, `date`, `software`, `description`, `tags`, `version`, and `status`; set image `placeholder` flags to `false`.
4. Reference a centralized `externalLinkId` when a verified source exists. Enable downloads only with explicit permission.

### Projects

1. Put an approved screenshot in `public/projects/` and set `screenshot.placeholder` to `false`.
2. Add a unique record to [`data/projects.ts`](data/projects.ts). Unknown year, open-source state, technologies, repository, or live URL should remain `null`/empty and be explained honestly in `developmentNote` when useful.
3. Add live and repository URLs as separate entries in `data/links.ts`, then reference their IDs through `liveLinkId` and `repositoryLinkId`.
4. List only verified features. Do not claim that forks are original work or add stars, users, contributors, download counts, or unsupported status labels.

### Videos

1. Put an approved thumbnail in `public/videos/`.
2. Add the specific upload URL to `data/links.ts`. Add it to `linkDirectoryOrder` only if it should also appear as a public bookmark; item-only links may remain outside that array.
3. Add a record to [`data/videos.ts`](data/videos.ts), using the new key for `externalLinkId` and an existing channel key for `channelLinkId`.
4. Fill title, platform, category, upload date, description, duration, featured state, and status from the real upload. Set `thumbnail.placeholder` to `false`.

Standard YouTube and Bilibili video URLs can produce a player. The iframe is not created until the visitor chooses **load video**, never autoplays, and can be unloaded. Unsupported providers still work as external links; do not add an unreviewed third-party embed or an auto-loading timeline.

### Social links and contact choices

[`data/links.ts`](data/links.ts) is the canonical URL registry.

- Add or edit records in `links`; use HTTPS and verify the destination manually.
- Put keys in `linkDirectoryOrder` to control the complete directory order.
- Use `featured: true` to pin a directory entry.
- Update the exported `contactLinkIds` for the contact panel.
- Update `profile.quickLinkIds` for home-page shortcuts. Keep `profile.contactLinkIds` synchronized with the contact choices in the content model.
- Content records should store a `LinkId`, never a duplicate raw URL.

When introducing a new username, category, status, or other constrained value, update its union in `lib/content-types.ts` deliberately rather than weakening types with `any`.

### Profile, status, navigation, messages, and osu! data

- Edit public identity copy, interests, home shortcuts, contact copy, and SEO text in `data/profile.ts`.
- Edit the manual now-playing/making/project panel in [`data/status.ts`](data/status.ts). Keep `source: "manual"` and update `lastUpdated` when the text changes.
- Edit section labels and order in `data/navigation.ts`. A new route also needs a matching `app/<route>/page.tsx` and metadata.
- Edit footer/loading/empty-state text in `data/messages.ts`.
- Edit only verified profile, setup, goal, and publicly associated map-title information in `data/osu.ts`. Changing statistics remain omitted by default.
- Edit optional secret-folder content and accessible alternatives in `data/easter-eggs.ts`; essential information must stay in the main archive.

### Themes

Existing palette labels and color values live in [`data/themes.ts`](data/themes.ts). `SiteShell` maps the selected palette to CSS custom properties and saves the visitor's choice in `localStorage`.

- To recolor an existing theme, edit its `colors` object and check text, border, focus, warning, and status contrast.
- Change `defaultThemeId` to select another default.
- `archive` is intentionally hidden until unlocked but is also available through the accessible control on the `???` page.
- Adding a new theme ID requires extending `ThemeOption["id"]` in `lib/content-types.ts`; add a matching CSS fallback selector in `app/globals.css` when the pre-hydration appearance matters.

Do not communicate status only with color, and test each changed palette with keyboard focus visible.

## Optional integrations

The checked-in manual data should remain a complete fallback. Any integration is an enhancement, not a runtime requirement.

### Official osu! API

If live osu! values are genuinely wanted, fetch only from the official osu! API in server-only code. Store client credentials in `.env.local`, never expose a client secret through a `NEXT_PUBLIC_` variable, validate the response, cache/revalidate it, handle rate limits and downtime, and label values with their source and update time. Hide failed or stale values instead of displaying zero. Do not infer achievements from API fields, and keep the current manual profile usable without credentials.

### Privacy-gated video providers

The current YouTube privacy-enhanced and Bilibili embeds are click-gated. For another provider, add an explicit hostname/ID allowlist and URL parser, preserve the unloaded thumbnail state, avoid autoplay and unnecessary iframe permissions, retain a direct-link alternative, and explain that clicking loads third-party content. Never preload every player.

Avoid automatic Pixiv scraping, a full X timeline, follower/view counters, or presence/music integrations unless the owner intentionally chooses a secure, documented, privacy-reviewed implementation.

## Accessibility notes

- The shell includes a skip link, semantic landmarks, labelled navigation, visible focus rings, touch-sized primary controls, and an always-visible route to optional secret content.
- The command palette and art lightbox use modal semantics, trap focus, close with `Escape`, and restore focus. Artwork also supports previous/next arrow keys; the video playlist supports arrow, Home, and End keys.
- Decorative graphics/icons are hidden from assistive technology where appropriate; real content needs specific alt text. Thumbnail duplicates use empty alt text to avoid repetition.
- Status changes use live regions or text labels, not color alone. Content-warning and download decisions remain explicit data.
- CSS and motion components respect `prefers-reduced-motion`; the site remains navigable when transitions are removed.
- Re-test keyboard order, dialog behavior, zoomed text, mobile overflow, alt text, and WCAG contrast after changing content, controls, or themes.

## Performance notes

- Pages use static local TypeScript data and server rendering; only interactive galleries, browsers, themes, and tools are client components.
- `next/image` supplies responsive image optimization. Gallery images are lazy-loaded and only the home avatar is prioritized.
- Video thumbnails and metadata are local. Third-party iframes are constructed only after consent and are unloaded when the selection changes or the visitor chooses to unload them.
- No database, auth client, analytics, social widgets, or runtime content SDK is in the default bundle.
- Keep raster files sensibly compressed, avoid preloading a whole gallery, and do not turn decorative effects into continuous high-CPU animation. Run a production build before publishing to catch route, type, and image problems.
