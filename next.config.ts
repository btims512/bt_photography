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
    // The widths the optimizer is allowed to generate, replacing Next's
    // default set (which runs to 2048 and 3840).
    //
    // A rail photo asks for 100vw, so the browser picks the first width at
    // or above the screen's physical pixels. An iPhone 14 Pro Max is 430
    // CSS px at DPR 3 = 1290, and against the default set that rounded up
    // to 1920 - a third more pixels than the screen can show, every one of
    // them decoded and held. At 4 bytes a pixel that is 21MB per photo
    // rather than 10MB, and the whole page's worth is what leaves Safari
    // short of memory. 1290 is here so that device gets its own width
    // exactly, and 1170 for the 390px iPhones below it.
    //
    // 1920 stays as the ceiling for desktop, where the rail is genuinely
    // that wide. Nothing above it: no viewport this site has been measured
    // on asks for more, so those entries only ever cost memory.
    deviceSizes: [640, 750, 828, 1080, 1170, 1290, 1920],
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
