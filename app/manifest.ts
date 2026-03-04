import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobTrackr",
    short_name: "JobTrackr",
    description: "Neo-brutal job hunt platform with tracker, analytics, and automation.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#0F172A",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
