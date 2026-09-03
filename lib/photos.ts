import type { Photo } from '@/lib/masonry';

export type { Photo };

export const musicPhotos: Photo[] = [
  { src: '/photos/DSC_4974-3.jpg', alt: 'Rapper mid-verse with one arm raised, stage lights streaking outward behind him in a zoom blur', width: 6016, height: 4016 },
  { src: '/photos/DSC_4403-Edit.jpg', alt: 'Five band members lounging across a couch in a green-lit garage, an acoustic guitar hanging on the wall behind them', width: 6016, height: 4016 },
  { src: '/photos/DSC_9196-Edit.jpg', alt: 'Woman in light-up pink shutter glasses singing into a sparkling microphone at a party, a man in a green sequin hat dancing behind her', width: 5431, height: 3625 },
  { src: '/photos/tony-scar-final.jpg', alt: 'Musician singing into a microphone while playing a sticker-covered acoustic guitar under a stage spotlight, inside a thin white frame', width: 1122, height: 1402 , project: 'framed', projectOrder: 4 },
];

export const comedyPhotos: Photo[] = [
  { src: '/photos/DSC_5916-c.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670 },
  { src: '/photos/DSC_3615-c.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 4000, height: 2670 },
  { src: '/photos/DSC_5544-c.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 4000, height: 2670 },
  { src: '/photos/DSC_4726-Edit-3-c.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670 },
  { src: '/photos/btp-82-c.jpg', alt: 'Portrait of a comedian with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024 },
  { src: '/photos/btp-150-c-Edit.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him, inside a thin white frame', width: 2670, height: 3336 , project: 'framed', projectOrder: 5 },
  { src: '/photos/btp-152-c.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700 , project: 'framed', projectOrder: 3 },
  { src: '/photos/artboard-2-copy-4-c.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402 , project: 'framed', projectOrder: 1 },
  { src: '/photos/DSC_6283-Edit-c.jpg', alt: 'Mustached comedian on stage smiling and gesturing while holding out a microphone by its cable', width: 6016, height: 4016 },
  { src: '/photos/9719763-c.jpg', alt: 'Stacked portrait of three comedians in caps, lit in purple and green', width: 1929, height: 2600 },
  { src: '/photos/11683013-2-c.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 3000, height: 4088 },
  { src: '/photos/11096857-c.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000 },
];

export const portraitPhotos: Photo[] = [
  { src: '/photos/DSC_7401-Edit-2.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670 },
  { src: '/photos/btp-72.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000 },
  { src: '/photos/btp-135.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048 },
  { src: '/photos/btp-7-Edit-2.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972 },
  { src: '/photos/IMG_5910.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1297, height: 1748 },
  { src: '/photos/btp-30.jpg', alt: 'Woman in a fur coat and red lingerie standing beneath string lights at night with blue and pink neon lighting', width: 4000, height: 2667 },
  { src: '/photos/btp-153.jpg', alt: 'Portrait photograph', width: 5444, height: 8000 },
  { src: '/photos/btp-31.jpg', alt: 'Blonde woman in a navy fur coat glancing back beneath a canopy of blue string lights in a city alley', width: 3615, height: 5561 },
  { src: '/photos/cass_3349.jpg', alt: 'Woman in a white ruffled dress and studded denim jacket posing with blue cat-eye sunglasses among balloons in purple and blue light', width: 3534, height: 5293 },
  { src: '/photos/DSC_3177-Edit-Edit.jpg', alt: 'Three boys goofing around in the middle of a suburban street at sunset, one held upside down over another boy shoulder', width: 3899, height: 5841 },
  { src: '/photos/btp-124.jpg', alt: 'Boy in a straw cowboy hat carrying a Texas flag across the granite dome of Enchanted Rock', width: 3024, height: 4032 },
  { src: '/photos/DSC_3224.jpg', alt: 'Bearded man in a backwards cap crouched on the asphalt at dusk, shot wide against a deep blue sky and power lines', width: 6016, height: 4016 },
  { src: '/photos/DSC_7286-2-2.jpg', alt: 'Man with dreadlocks and a plaid shirt looking back over his shoulder against city lights at night', width: 6016, height: 4016 },
  { src: '/photos/btp-47.jpg', alt: 'Woman smiling widely with sunglasses pushed up into her hair, seated on a sunlit patio', width: 5501, height: 3824 },
  { src: '/photos/artboard-2-11.jpg', alt: 'Stylized portrait of a smiling man in a backwards cap and gold chains throwing a peace sign, composited over a stormy city skyline lit by lightning', width: 1122, height: 1402 , project: 'framed', projectOrder: 2 },
];

// Tagged by category so the home page can interleave genres (see
// interleaveByCategory in lib/masonry.ts) instead of clumping same-genre
// photos together. Order here doesn't matter for display, only for the
// shortest-column fallback if interleaving is ever skipped.
export const featuredPhotos: Photo[] = [
  // The five below carry project: 'framed'. Their place in this list no
  // longer decides anything about the rail - projectOrder does, and
  // chunkWithRails picks the rail out of the whole list - so they sit with
  // their own categories here and mix into the grid like anything else.
  // Grouping them at the top of this array is what previously made them
  // the first photos on the desktop page.

  // One body of work, kept in this order on purpose: Photo.project
  // makes interleaveByCategory emit them as a run in the order written
  // here, and that run is the order they slide past in the rail.
  // Whichever of them share an aspect ratio form that rail (see
  // projectGroups in lib/masonry.ts); any that don't sit beside it in
  // the grid instead, so nothing is dropped and nothing is letterboxed.

  { src: '/photos/DSC_7401-Edit-2.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670, category: 'portraits' },
  { src: '/photos/btp-72.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000, category: 'portraits' },
  { src: '/photos/btp-135.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048, category: 'portraits' },
  { src: '/photos/btp-7-Edit-2.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972, category: 'portraits' },
  { src: '/photos/IMG_5910.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1297, height: 1748, category: 'portraits' },
  { src: '/photos/btp-30.jpg', alt: 'Woman in a fur coat and red lingerie standing beneath string lights at night with blue and pink neon lighting', width: 4000, height: 2667, category: 'portraits' },
  { src: '/photos/btp-153.jpg', alt: 'Portrait photograph', width: 5444, height: 8000, category: 'portraits' },
  { src: '/photos/btp-31.jpg', alt: 'Blonde woman in a navy fur coat glancing back beneath a canopy of blue string lights in a city alley', width: 3615, height: 5561, category: 'portraits' },
  { src: '/photos/cass_3349.jpg', alt: 'Woman in a white ruffled dress and studded denim jacket posing with blue cat-eye sunglasses among balloons in purple and blue light', width: 3534, height: 5293, category: 'portraits' },
  { src: '/photos/DSC_3177-Edit-Edit.jpg', alt: 'Three boys goofing around in the middle of a suburban street at sunset, one held upside down over another boy shoulder', width: 3899, height: 5841, category: 'portraits' },
  { src: '/photos/btp-124.jpg', alt: 'Boy in a straw cowboy hat carrying a Texas flag across the granite dome of Enchanted Rock', width: 3024, height: 4032, category: 'portraits' },
  { src: '/photos/DSC_3224.jpg', alt: 'Bearded man in a backwards cap crouched on the asphalt at dusk, shot wide against a deep blue sky and power lines', width: 6016, height: 4016, category: 'portraits' },
  { src: '/photos/DSC_7286-2-2.jpg', alt: 'Man with dreadlocks and a plaid shirt looking back over his shoulder against city lights at night', width: 6016, height: 4016, category: 'portraits' },
  { src: '/photos/btp-47.jpg', alt: 'Woman smiling widely with sunglasses pushed up into her hair, seated on a sunlit patio', width: 5501, height: 3824, category: 'portraits' },
  { src: '/photos/artboard-2-11.jpg', alt: 'Stylized portrait of a smiling man in a backwards cap and gold chains throwing a peace sign, composited over a stormy city skyline lit by lightning', width: 1122, height: 1402, category: 'portraits' , project: 'framed', projectOrder: 2 },
  { src: '/photos/DSC_5916-c.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/DSC_3615-c.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/DSC_5544-c.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/DSC_4726-Edit-3-c.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/btp-82-c.jpg', alt: 'Close-up portrait of a bearded man with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024, category: 'comedy' },
  { src: '/photos/DSC_6283-Edit-c.jpg', alt: 'Mustached comedian on stage smiling and gesturing while holding out a microphone by its cable', width: 6016, height: 4016, category: 'comedy' },
  { src: '/photos/9719763-c.jpg', alt: 'Stacked portrait of three comedians in caps, lit in purple and green', width: 1929, height: 2600, category: 'comedy' },
  { src: '/photos/11683013-2-c.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 3000, height: 4088, category: 'comedy' },
  { src: '/photos/11096857-c.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000, category: 'comedy' },
  { src: '/photos/btp-152-c.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700, category: 'comedy' , project: 'framed', projectOrder: 3 },
  { src: '/photos/artboard-2-copy-4-c.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402, category: 'comedy' , project: 'framed', projectOrder: 1 },
  { src: '/photos/btp-150-c-Edit.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him, inside a thin white frame', width: 2670, height: 3336, category: 'comedy' , project: 'framed', projectOrder: 5 },
  { src: '/photos/DSC_4974-3.jpg', alt: 'Rapper mid-verse with one arm raised, stage lights streaking outward behind him in a zoom blur', width: 6016, height: 4016, category: 'music' },
  { src: '/photos/DSC_4403-Edit.jpg', alt: 'Five band members lounging across a couch in a green-lit garage, an acoustic guitar hanging on the wall behind them', width: 6016, height: 4016, category: 'music' },
  { src: '/photos/DSC_9196-Edit.jpg', alt: 'Woman in light-up pink shutter glasses singing into a sparkling microphone at a party, a man in a green sequin hat dancing behind her', width: 5431, height: 3625, category: 'music' },
  { src: '/photos/tony-scar-final.jpg', alt: 'Musician singing into a microphone while playing a sticker-covered acoustic guitar under a stage spotlight, inside a thin white frame', width: 1122, height: 1402, category: 'music' , project: 'framed', projectOrder: 4 },
  // No category: scenic shots that don't fit comedy/portraits/music and
  // aren't getting their own section, so they're left untagged - the home
  // page still shows them (interleaveByCategory appends untagged photos
  // after the categorized ones instead of dropping them), just without
  // forcing them into a category they don't belong to.
  { src: '/photos/btp-151-2.jpg', alt: 'Portrait of Willie Nelson projected in light onto the side of an old bus under a starry night sky', width: 4000, height: 2729 },
  { src: '/photos/btp-67.jpg', alt: 'Sheer canyon walls catching low sun above a still green river that mirrors them', width: 8000, height: 12000 },
];
