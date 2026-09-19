import type { MetadataRoute } from "next";

/** Tells the phone how to install the app: its name, icon, and that it opens without browser bars. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sincewhen",
    short_name: "Sincewhen",
    description: "Recurring tasks that come due based on when you last did them.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // "maskable" lets Android crop the icon to its own shape, so this one has extra padding.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
