import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { hero } from "./content";

// The picture a shared link to /about shows (Messages, Reddit, Slack). Drawn once at build time
// from the landing page's own words and screenshot, so it cannot drift from the page. Next.js
// adds the og:image and twitter:image tags for this route by itself.

export const alt = `Sincewhen. ${hero.title} ${hero.eyebrow}. A phone shows the Folders screen, with each place colored by what is due.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The logo's three status colors, as on the landing page header (green, yellow, red). */
const DOT_COLORS = ["#22c55e", "#facc15", "#ef4444"];

export default async function Image() {
  const screenshot = await readFile(join(process.cwd(), "public/landing/folders-light.png"));
  const screenshotSrc = `data:image/png;base64,${screenshot.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          background: "#ffffff",
          color: "#0a0a0a",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {DOT_COLORS.map((color) => (
              <div key={color} style={{ width: 22, height: 22, borderRadius: 11, background: color }} />
            ))}
            <div style={{ fontSize: 44, marginLeft: 8 }}>Sincewhen</div>
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.1, marginTop: 44, letterSpacing: -1.5 }}>{hero.title}</div>
          <div style={{ fontSize: 30, color: "#525252", marginTop: 32 }}>{hero.eyebrow}</div>
        </div>
        <div
          style={{
            display: "flex",
            borderRadius: 44,
            border: "10px solid #171717",
            background: "#171717",
            overflow: "hidden",
          }}
        >
          <img src={screenshotSrc} width={250} height={541} alt="" />
        </div>
      </div>
    ),
    size,
  );
}
