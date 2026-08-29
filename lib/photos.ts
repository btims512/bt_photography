import type { Photo } from '@/lib/masonry';

export const musicPhotos: Photo[] = [
  { src: 'https://loremflickr.com/600/400/musician,stage,concert', alt: 'Music performance 1', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/live,music,performance', alt: 'Music performance 2', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/guitar,stage,lights', alt: 'Music performance 3', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/singer,microphone,stage', alt: 'Music performance 4', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/concert,audience,crowd', alt: 'Music performance 5', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/music,festival,event', alt: 'Music performance 6', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/band,rock,live', alt: 'Music performance 7', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/concert,lighting,drama', alt: 'Music performance 8', width: 2, height: 3 },
];

export const comedyPhotos: Photo[] = [
  { src: 'https://loremflickr.com/600/400/comedy,performance', alt: 'Comedy performance 1', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/comedy,audience', alt: 'Comedy performance 2', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/stand-up,stage', alt: 'Comedy performance 3', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/comedy,stage,lighting', alt: 'Comedy performance 4', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/performance,crowd', alt: 'Comedy performance 5', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/comedian,crowd,applause', alt: 'Comedy performance 6', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/stand-up,microphone', alt: 'Comedy performance 7', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/comedy,stage,audience', alt: 'Comedy performance 8', width: 2, height: 3 },
];

export const portraitPhotos: Photo[] = [
  { src: 'https://loremflickr.com/600/400/portrait,person', alt: 'Portrait 1', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/portrait,face', alt: 'Portrait 2', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/headshot,studio', alt: 'Portrait 3', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/portrait,character', alt: 'Portrait 4', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/portrait,expression', alt: 'Portrait 5', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/face,close-up,portrait', alt: 'Portrait 6', width: 2, height: 3 },
  { src: 'https://loremflickr.com/600/400/portrait,studio,lighting', alt: 'Portrait 7', width: 3, height: 2 },
  { src: 'https://loremflickr.com/400/600/portrait,black-and-white', alt: 'Portrait 8', width: 2, height: 3 },
];

// Ordered so every group of 3 reads landscape / portrait / landscape where
// the available photos allow it (feeds distributeRoundRobin's fixed column
// assignment in PortfolioSection).
export const featuredPhotos: Photo[] = [
  { src: '/photos/DSC_7401-Edit-2.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 6016, height: 4016 },
  { src: '/photos/btp-72.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 8000, height: 12000 },
  { src: '/photos/btp-135.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048 },
  { src: 'https://loremflickr.com/600/400/concert,audience,crowd', alt: 'Featured work 5', width: 3, height: 2 },
  { src: '/photos/btp-7-Edit.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972 },
  { src: '/photos/IMG_5910.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1320, height: 1748 },
  { src: 'https://loremflickr.com/400/600/music,festival,event', alt: 'Featured work 6', width: 2, height: 3 },
  { src: '/photos/btp-30.jpg', alt: 'Woman in a fur coat and red lingerie standing beneath string lights at night with blue and pink neon lighting', width: 5065, height: 3377 },
  { src: '/photos/artboard-2-copy-4.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402 },
];
