export default function AboutPage() {
  return (
    <div className="w-full">
      <div className="px-6 py-24 md:px-[50px]">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-800 mb-6" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>About BT</h1>
          <p className="text-lg mb-4" style={{color: 'var(--dim)'}}>
            Welcome to my photography portfolio. I specialize in capturing moments across comedy, portraiture, and live music.
          </p>
          <p className="text-lg" style={{color: 'var(--dim)'}}>
            Each image tells a story of energy, emotion, and authentic moments frozen in time.
          </p>
        </div>
      </div>
    </div>
  );
}
