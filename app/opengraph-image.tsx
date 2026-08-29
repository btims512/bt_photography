import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'The Bt Photography';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const svgContent = readFileSync(join(process.cwd(), 'public', 'bt-mark.svg'), 'utf-8');
  const markDataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F4F4F5',
        }}
      >
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 10, color: '#17171A' }}>THE</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markDataUri} width={440} height={214} style={{ marginTop: 8, marginBottom: 8 }} />
        <div style={{ display: 'flex', fontSize: 48, letterSpacing: 24, color: '#17171A', marginTop: 4 }}>
          PHOTOGRAPHY
        </div>
        <div style={{ display: 'flex', marginTop: 22, width: 360, height: 2, backgroundColor: '#17171A' }} />
      </div>
    ),
    { ...size }
  );
}
