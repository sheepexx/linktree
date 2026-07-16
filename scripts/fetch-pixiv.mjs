import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USER_ID = "115687408";
const ART_COUNT = Number(process.env.PIXIV_COUNT ?? 6);
const INCLUDE_R18 = process.env.PIXIV_INCLUDE_R18 === "1";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Referer: "https://www.pixiv.net/",
};

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const artDir = path.join(root, "public", "art");
const dataFile = path.join(root, "data", "pixiv-art.ts");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { ...HEADERS, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`${url} -> pixiv error: ${data.message}`);
  return data.body;
}

async function main() {
  console.log(`fetching artwork list for pixiv user ${USER_ID} ...`);
  const profile = await fetchJson(
    `https://www.pixiv.net/ajax/user/${USER_ID}/profile/all?lang=en`,
  );
  const ids = Object.keys(profile.illusts ?? {}).sort(
    (a, b) => Number(b) - Number(a),
  );
  if (ids.length === 0) throw new Error("no public artworks found");

  const selected = [];
  for (const id of ids) {
    if (selected.length >= ART_COUNT) break;
    const illust = await fetchJson(
      `https://www.pixiv.net/ajax/illust/${id}?lang=en`,
    );
    if (!INCLUDE_R18 && illust.xRestrict > 0) {
      console.log(`  skipping ${id} (age-restricted)`);
      continue;
    }
    selected.push({
      id,
      title: illust.title?.trim() || `untitled ${id}`,
      url: illust.urls.regular,
      width: illust.width,
      height: illust.height,
    });
    console.log(`  ${id}: ${illust.title} (${illust.width}x${illust.height})`);
    await sleep(300);
  }

  await mkdir(artDir, { recursive: true });
  for (const file of await readdir(artDir)) {
    if (file.startsWith("pixiv-")) await rm(path.join(artDir, file));
  }

  const entries = [];
  for (const work of selected) {
    const ext = path.extname(new URL(work.url).pathname) || ".jpg";
    const fileName = `pixiv-${work.id}${ext}`;
    const response = await fetch(work.url, { headers: HEADERS });
    if (!response.ok) {
      throw new Error(`image ${work.url} -> HTTP ${response.status}`);
    }
    await writeFile(
      path.join(artDir, fileName),
      Buffer.from(await response.arrayBuffer()),
    );
    console.log(`  saved public/art/${fileName}`);
    entries.push({
      id: `pixiv-${work.id}`,
      title: work.title,
      category: "art",
      image: {
        src: `/art/${fileName}`,
        alt: `${work.title} by sheepex_`,
      },
      aspect: `${work.width} / ${work.height}`,
    });
    await sleep(300);
  }

  const source = `import type { GalleryItem } from "../lib/content-types";

export const pixivArt: readonly GalleryItem[] = ${JSON.stringify(entries, null, 2)};
`;
  await writeFile(dataFile, source);
  console.log(`wrote data/pixiv-art.ts with ${entries.length} entries`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
