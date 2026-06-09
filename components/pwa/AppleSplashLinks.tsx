import { SPLASH_SCREENS } from "@/lib/pwa/config";

export default function AppleSplashLinks() {
  return (
    <>
      {SPLASH_SCREENS.map(({ media, href }) => (
        <link
          key={href}
          rel="apple-touch-startup-image"
          media={media}
          href={href}
        />
      ))}
    </>
  );
}
