import type { Photo } from '@/lib/masonry';

export type { Photo };

export const musicPhotos: Photo[] = [];

export const comedyPhotos: Photo[] = [
  { src: '/photos/DSC_5916-c.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670 },
  { src: '/photos/DSC_3615-c.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 4000, height: 2670 },
  { src: '/photos/DSC_5544-c.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 4000, height: 2670 },
  { src: '/photos/DSC_4726-Edit-3-c.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670 },
  { src: '/photos/btp-82-c.jpg', alt: 'Portrait of a comedian with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024 },
  { src: '/photos/btp-150-c.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him', width: 2670, height: 4000 },
  { src: '/photos/btp-152-c.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700 },
  { src: '/photos/artboard-2-copy-4-c.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402 },
  { src: '/photos/DSC_4929-c.jpg', alt: 'Comedian in a green trucker cap looking at the camera, lit warmly against a dark staircase backdrop', width: 5667, height: 3783 },
  { src: '/photos/DSC_6283-Edit-c.jpg', alt: 'Mustached comedian on stage smiling and gesturing while holding out a microphone by its cable', width: 6016, height: 4016 },
  { src: '/photos/9719763-c.jpg', alt: 'Stacked portrait of three comedians in caps, lit in purple and green', width: 2000, height: 2600 },
  { src: '/photos/11683013-2-c.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 3000, height: 4088 },
  { src: '/photos/11096857-c.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000 },
];

export const portraitPhotos: Photo[] = [
  { src: '/photos/DSC_7401-Edit-2.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670 },
  { src: '/photos/btp-72.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000 },
  { src: '/photos/btp-135.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048 },
  { src: '/photos/btp-7-Edit-2.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972 },
  { src: '/photos/IMG_5910.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1320, height: 1748 },
  { src: '/photos/btp-30.jpg', alt: 'Woman in a fur coat and red lingerie standing beneath string lights at night with blue and pink neon lighting', width: 4000, height: 2667 },
  { src: '/photos/btp-153.jpg', alt: 'Portrait photograph', width: 5444, height: 8000 },
];

// Tagged by category so the home page can interleave genres (see
// interleaveByCategory in lib/masonry.ts) instead of clumping same-genre
// photos together. Order here doesn't matter for display, only for the
// shortest-column fallback if interleaving is ever skipped.
export const featuredPhotos: Photo[] = [
  { src: '/photos/DSC_7401-Edit-2.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670, category: 'portraits' },
  { src: '/photos/btp-72.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000, category: 'portraits' },
  { src: '/photos/btp-135.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048, category: 'portraits' },
  { src: '/photos/btp-7-Edit-2.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972, category: 'portraits' },
  { src: '/photos/IMG_5910.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1320, height: 1748, category: 'portraits' },
  { src: '/photos/btp-30.jpg', alt: 'Woman in a fur coat and red lingerie standing beneath string lights at night with blue and pink neon lighting', width: 4000, height: 2667, category: 'portraits' },
  { src: '/photos/btp-153.jpg', alt: 'Portrait photograph', width: 5444, height: 8000, category: 'portraits' },
  { src: '/photos/DSC_5916-c.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/DSC_3615-c.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/DSC_5544-c.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/DSC_4726-Edit-3-c.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/btp-82-c.jpg', alt: 'Close-up portrait of a bearded man with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024, category: 'comedy' },
  { src: '/photos/btp-150-c.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him', width: 2670, height: 4000, category: 'comedy' },
  { src: '/photos/btp-152-c.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700, category: 'comedy' },
  { src: '/photos/artboard-2-copy-4-c.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402, category: 'comedy' },
  { src: '/photos/DSC_4929-c.jpg', alt: 'Comedian in a green trucker cap looking at the camera, lit warmly against a dark staircase backdrop', width: 5667, height: 3783, category: 'comedy' },
  { src: '/photos/DSC_6283-Edit-c.jpg', alt: 'Mustached comedian on stage smiling and gesturing while holding out a microphone by its cable', width: 6016, height: 4016, category: 'comedy' },
  { src: '/photos/9719763-c.jpg', alt: 'Stacked portrait of three comedians in caps, lit in purple and green', width: 2000, height: 2600, category: 'comedy' },
  { src: '/photos/11683013-2-c.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 3000, height: 4088, category: 'comedy' },
  { src: '/photos/11096857-c.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000, category: 'comedy' },
  // No category: a landscape shot that doesn't fit comedy/portraits/music
  // and isn't getting its own section, so it's left untagged - the home
  // page still shows it (interleaveByCategory appends untagged photos
  // after the categorized ones instead of dropping them), just without
  // forcing it into a category it doesn't belong to.
  { src: '/photos/btp-151.jpg', alt: 'Portrait of Willie Nelson projected in light onto the side of an old bus under a starry night sky', width: 4000, height: 2729 },
];
