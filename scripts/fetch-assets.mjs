import { mkdir, writeFile } from "node:fs/promises";
const images = {
  headphones: "1546435770-a3e426bf472b",
  tote: "1544816155-12df9643f363",
  lamp: "1507473885765-e6ed057f782c",
  bottle: "1602143407151-7111542de6e8",
  sneakers: "1542291026-7eec264c27ff",
  sweatshirt: "1556821840-3a63f95609a7",
  mug: "1514228742587-6b1558fcca3d",
  speaker: "1608043152269-423dbba4e7e1",
  backpack: "1553062407-98eeb64c6a62",
  notebook: "1531346878377-a5be20888e57",
  planter: "1485955900006-10f4d324d411",
  tee: "1521572163474-6864f9cf17ab",
  hero: "1600210492486-724fe5c67fb0",
};
await mkdir("public/products", { recursive: true });
await mkdir("public/fonts", { recursive: true });
const results = await Promise.allSettled(
  Object.entries(images).map(async ([name, id]) => {
    const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${name === "hero" ? 1200 : 540}&q=85`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw new Error(`${name}: ${response.status}`);
    await writeFile(
      `public/products/${name}.jpg`,
      new Uint8Array(await response.arrayBuffer()),
    );
    return name;
  }),
);
for (const result of results)
  console.log(
    result.status === "fulfilled"
      ? `Saved ${result.value}`
      : result.reason.message,
  );
const font = await fetch(
  "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf",
);
if (!font.ok) throw new Error("Font download failed");
await writeFile(
  "public/fonts/manrope.ttf",
  new Uint8Array(await font.arrayBuffer()),
);
await writeFile(
  "docs/ASSET-CREDITS.md",
  "# Asset credits\n\nProduct and interior photographs are illustrative stock images from Unsplash; they do not represent actual GoShop merchandise. Source images were downloaded for a reliable local demonstration.\n\n" +
    Object.entries(images)
      .map(
        ([name, id]) =>
          `- ${name}: https://unsplash.com/photos/${id} (image source: https://images.unsplash.com/photo-${id})`,
      )
      .join("\n") +
    "\n\nManrope typeface: https://fonts.google.com/specimen/Manrope (SIL Open Font License). Icons: Lucide, ISC license.\n",
);
