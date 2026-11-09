import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="w-full">
      <div className="px-6 py-24 md:px-[50px]">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start md:gap-16">
        <div>
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
        {/* The whole photograph, never cropped. The text beside it starts on the
            same top line, and both sit inside the same outer margins. On a
            phone it stacks below at the full column width. */}
        <Image
          src="/photos/about-ben.jpg"
          alt="Ben, the photographer behind BT Photography, smiling in a backwards cap and a black polo"
          width={1202}
          height={1800}
          sizes="(max-width: 767px) 100vw, 440px"
          quality={82}
          className="photo-protected h-auto w-full md:w-[440px]"
          draggable={false}
        />
        </div>
      </div>
    </div>
  );
}
