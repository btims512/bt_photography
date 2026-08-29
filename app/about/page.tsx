export default function AboutPage() {
  return (
    <div className="w-full">
      <div className="px-6 py-24 md:px-[50px]">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-800 mb-6" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>About Me</h1>
          <p className="text-lg mb-4" style={{color: 'var(--dim)'}}>
            My name&apos;s Ben. I&apos;m a photographer based in Austin, mostly shooting events, stand-up comedy, live music, and portraits.
          </p>
          <p className="text-lg mb-4" style={{color: 'var(--dim)'}}>
            Comedy&apos;s the one I keep coming back to. There&apos;s a specific second, right as a joke lands and the room reacts, that I never get tired of trying to catch. That&apos;s not the only thing I shoot, though; if there&apos;s a stage or a show or someone worth photographing, I&apos;ll usually show up with a camera.
          </p>
          <p className="text-lg" style={{color: 'var(--dim)'}}>
            I travel a fair amount too, so not everything here was shot in Austin, just wherever I happened to be. And to be clear, this is a personal portfolio, not a business page. No packages, no pitch, just work I&apos;ve done that I like enough to put up.
          </p>
        </div>
      </div>
    </div>
  );
}
