import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones/other devices on the home network load the dev server via
  // the Mac's LAN IP - Next 16 blocks cross-origin requests to its dev
  // resources (JS chunks, HMR) by default, which renders as a white page
  // with no working JS on the phone even though the HTML itself loads. If
  // the router ever reassigns the Mac's IP, update this to match.
  allowedDevOrigins: ["192.168.1.34"],
  images: {
    qualities: [75, 82, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default nextConfig;
