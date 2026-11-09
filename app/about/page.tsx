import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="w-full">
      <div className="px-6 py-24 md:px-[50px]">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start md:gap-16">
        <div>
          <h1 className="text-4xl font-800 mb-6" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>About Me</h1>
          <p className="text-lg mb-4" style={{color: 'var(--dim)'}}>
            I’m Ben, a photographer based in Austin, specializing in stand-up comedy.
          </p>
          <p className="text-lg mb-4" style={{color: 'var(--dim)'}}>
            I work regularly with comedians from the Kill Tony universe, photographing live shows, backstage moments, and portraits. I aim to capture the atmosphere in a way that feels immersive, giving you a sense of being there that night.
          </p>
          <p className="text-lg mb-4" style={{color: 'var(--dim)'}}>
            Alongside comedy, I shoot live music, events, and portrait sessions. I’m happy to talk through ideas for a shoot, whether you need event coverage, new headshots or promotional photos, or want to try something more creative.
          </p>
          <p className="text-lg" style={{color: 'var(--dim)'}}>
            This site brings together some of my favorite work. If you’d like to work together,{' '}
            <Link href="/book" style={{color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px'}}>
              get in touch
            </Link>
            .
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
