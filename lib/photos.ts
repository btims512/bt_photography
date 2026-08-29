import type { Photo } from '@/lib/masonry';

export type { Photo };

export const musicPhotos: Photo[] = [];

export const comedyPhotos: Photo[] = [
  { src: '/photos/DSC_5916.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 6016, height: 4016 },
  { src: '/photos/DSC_3615.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 5310, height: 3545 },
  { src: '/photos/DSC_5544.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 6016, height: 4016 },
  { src: '/photos/DSC_4726-Edit-3.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 6016, height: 4016 },
];

export const portraitPhotos: Photo[] = [
  { src: '/photos/btp-82.jpg', alt: 'Close-up portrait of a bearded man with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024 },
];

// Tagged by category so the home page can interleave genres (see
// interleaveByCategory in lib/masonry.ts) instead of clumping same-genre
// photos together. Order here doesn't matter for display, only for the
// shortest-column fallback if interleaving is ever skipped.
export const featuredPhotos: Photo[] = [
  { src: '/photos/DSC_7401-Edit-2.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 6016, height: 4016, category: 'portraits' },
  { src: '/photos/btp-72.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 8000, height: 12000, category: 'portraits' },
  { src: '/photos/btp-135.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048, category: 'portraits' },
  { src: '/photos/btp-7-Edit.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972, category: 'portraits' },
  { src: '/photos/IMG_5910.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1320, height: 1748, category: 'portraits' },
  { src: '/photos/btp-30.jpg', alt: 'Woman in a fur coat and red lingerie standing beneath string lights at night with blue and pink neon lighting', width: 5065, height: 3377, category: 'portraits' },
  { src: '/photos/artboard-2-copy-4.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402, category: 'portraits' },
  { src: '/photos/DSC_5916.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 6016, height: 4016, category: 'comedy' },
  { src: '/photos/DSC_3615.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 5310, height: 3545, category: 'comedy' },
  { src: '/photos/DSC_5544.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 6016, height: 4016, category: 'comedy' },
  { src: '/photos/DSC_4726-Edit-3.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 6016, height: 4016, category: 'comedy' },
  { src: '/photos/btp-82.jpg', alt: 'Close-up portrait of a bearded man with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024, category: 'portraits' },
];
