import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Xmas Presents",
    short_name: "Xmas Presents",
    description: "Track the family's Christmas presents and share the costs fairly.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfaf5",
    theme_color: "#1f6b45",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
