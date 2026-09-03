import type { Photo } from '@/lib/masonry';

export type { Photo };

/*
 * Photos are named by the section they belong to - comedy-NN, portrait-NN,
 * music-NN - and featured-NN for the few that suit no section and appear on
 * the home page only. The numbering is just folder order within each
 * section; it carries no meaning, so a photo can be renumbered or a gap left
 * without anything caring. Renaming a file means renaming it in the album
 * array AND in featuredPhotos below, since a photo is listed twice.
 */

export const musicPhotos: Photo[] = [
  { src: '/photos/music-01.jpg', alt: 'Five band members lounging across a couch in a green-lit garage, an acoustic guitar hanging on the wall behind them', width: 6016, height: 4016 },
  { src: '/photos/music-02.jpg', alt: 'Rapper mid-verse with one arm raised, stage lights streaking outward behind him in a zoom blur', width: 6016, height: 4016 },
];

export const comedyPhotos: Photo[] = [
  { src: '/photos/comedy-01.jpg', alt: 'Stacked portrait of three comedians in caps, lit in purple and green', width: 1929, height: 2600 },
  { src: '/photos/comedy-02.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000 },
  { src: '/photos/comedy-03.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 3000, height: 4088 },
  { src: '/photos/comedy-04.jpg', alt: 'Stylized portrait of a smiling man in a backwards cap and gold chains throwing a peace sign, composited over a stormy city skyline lit by lightning', width: 1122, height: 1402, project: 'framed', projectOrder: 2 },
  { src: '/photos/comedy-05.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402, project: 'framed', projectOrder: 1 },
  { src: '/photos/comedy-06.jpg', alt: 'Close-up portrait of a bearded man with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024 },
  { src: '/photos/comedy-07.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him, inside a thin white frame', width: 2670, height: 3336, project: 'framed', projectOrder: 5 },
  { src: '/photos/comedy-08.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700, project: 'framed', projectOrder: 3 },
  { src: '/photos/comedy-09.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 4000, height: 2670 },
  { src: '/photos/comedy-10.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670 },
  { src: '/photos/comedy-11.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 4000, height: 2670 },
  { src: '/photos/comedy-12.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670 },
  { src: '/photos/comedy-13.jpg', alt: 'Mustached comedian on stage smiling and gesturing while holding out a microphone by its cable', width: 6016, height: 4016 },
  { src: '/photos/comedy-14.jpg', alt: 'Musician singing into a microphone while playing a sticker-covered acoustic guitar under a stage spotlight, inside a thin white frame', width: 1122, height: 1402, project: 'framed', projectOrder: 4 },
];

export const portraitPhotos: Photo[] = [
  { src: '/photos/portrait-01.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972 },
  { src: '/photos/portrait-03.jpg', alt: 'Blonde woman in a navy fur coat glancing back beneath a canopy of blue string lights in a city alley', width: 3615, height: 5561 },
  { src: '/photos/portrait-04.jpg', alt: 'Woman smiling widely with sunglasses pushed up into her hair, seated on a sunlit patio', width: 5501, height: 3824 },
  { src: '/photos/portrait-05.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000 },
  { src: '/photos/portrait-06.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048 },
  { src: '/photos/portrait-07.jpg', alt: 'Portrait photograph', width: 5444, height: 8000 },
  { src: '/photos/portrait-08.jpg', alt: 'Woman in a white ruffled dress and studded denim jacket posing with blue cat-eye sunglasses among balloons in purple and blue light', width: 3534, height: 5293 },
  { src: '/photos/portrait-09.jpg', alt: 'Three boys goofing around in the middle of a suburban street at sunset, one held upside down over another boy shoulder', width: 3899, height: 5841 },
  { src: '/photos/portrait-10.jpg', alt: 'Bearded man in a backwards cap crouched on the asphalt at dusk, shot wide against a deep blue sky and power lines', width: 6016, height: 4016 },
  { src: '/photos/portrait-11.jpg', alt: 'Man with dreadlocks and a plaid shirt looking back over his shoulder against city lights at night', width: 6016, height: 4016 },
  { src: '/photos/portrait-12.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670 },
  { src: '/photos/portrait-13.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1297, height: 1748 },
];

/**
 * The order the mobile page opens with, by filename. These run first and in
 * this sequence, ahead of everything the interleaving and rail cadence
 * decide; add to the list to fix more of the opening, remove to hand a
 * photo back to the normal flow.
 *
 * Mobile only - desktop is left to its own interleaved order.
 *
 * A portrait named here is spent on the opening and can no longer fill a
 * rail, and rails are built from portraits, so each one costs a rail photo:
 * there are 17 portrait-shaped photos, the three rails want 15 between them,
 * and the three pinned below are why the third rail runs to four rather
 * than five. Landscape-shaped photos cost nothing - pin as many as you like.
 * (Shape, not section: a photo filed under comedy can still be rail supply.)
 */
export const MOBILE_LEAD: string[] = [
  '/photos/portrait-05.jpg',
  '/photos/music-02.jpg',
  '/photos/portrait-10.jpg',
  '/photos/portrait-13.jpg',
  '/photos/portrait-07.jpg',
  '/photos/portrait-11.jpg',
];

// Every photo the home page can show, tagged by section so it can interleave
// them (see interleaveByCategory in lib/masonry.ts) instead of clumping the
// same section together. The four featured-NN photos carry no tag: they suit
// no section, and untagged photos are appended after the tagged ones rather
// than dropped.
//
// Order here does matter, for desktop. The interleaving rotates through the
// sections and takes the next unused photo from each, so a photo's place
// within its own section decides how early it comes up - moving one higher
// moves it earlier on the desktop page. It has no such effect on mobile,
// where MOBILE_LEAD sets the opening and the rest is decided by the rail
// cadence.
export const featuredPhotos: Photo[] = [
  { src: '/photos/comedy-01.jpg', alt: 'Stacked portrait of three comedians in caps, lit in purple and green', width: 1929, height: 2600, category: 'comedy' },
  { src: '/photos/comedy-02.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000, category: 'comedy' },
  { src: '/photos/comedy-03.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 3000, height: 4088, category: 'comedy' },
  { src: '/photos/comedy-04.jpg', alt: 'Stylized portrait of a smiling man in a backwards cap and gold chains throwing a peace sign, composited over a stormy city skyline lit by lightning', width: 1122, height: 1402, category: 'comedy', project: 'framed', projectOrder: 2 },
  { src: '/photos/comedy-05.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402, category: 'comedy', project: 'framed', projectOrder: 1 },
  { src: '/photos/portrait-01.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972, category: 'portraits' },
  { src: '/photos/portrait-03.jpg', alt: 'Blonde woman in a navy fur coat glancing back beneath a canopy of blue string lights in a city alley', width: 3615, height: 5561, category: 'portraits' },
  { src: '/photos/portrait-04.jpg', alt: 'Woman smiling widely with sunglasses pushed up into her hair, seated on a sunlit patio', width: 5501, height: 3824, category: 'portraits' },
  { src: '/photos/featured-01.jpg', alt: 'Sheer canyon walls catching low sun above a still green river that mirrors them', width: 8000, height: 12000 },
  { src: '/photos/portrait-05.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000, category: 'portraits' },
  { src: '/photos/comedy-06.jpg', alt: 'Close-up portrait of a bearded man with a mullet and neck tattoos in a western print shirt, looking upward', width: 1536, height: 1024, category: 'comedy' },
  { src: '/photos/featured-02.jpg', alt: 'Boy in a straw cowboy hat carrying a Texas flag across the granite dome of Enchanted Rock', width: 3024, height: 4032 },
  { src: '/photos/portrait-06.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048, category: 'portraits' },
  { src: '/photos/comedy-07.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him, inside a thin white frame', width: 2670, height: 3336, category: 'comedy', project: 'framed', projectOrder: 5 },
  { src: '/photos/featured-03.jpg', alt: 'Portrait of Willie Nelson projected in light onto the side of an old bus under a starry night sky', width: 4000, height: 2729 },
  { src: '/photos/comedy-08.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700, category: 'comedy', project: 'framed', projectOrder: 3 },
  { src: '/photos/portrait-07.jpg', alt: 'Portrait photograph', width: 5444, height: 8000, category: 'portraits' },
  { src: '/photos/portrait-08.jpg', alt: 'Woman in a white ruffled dress and studded denim jacket posing with blue cat-eye sunglasses among balloons in purple and blue light', width: 3534, height: 5293, category: 'portraits' },
  { src: '/photos/portrait-09.jpg', alt: 'Three boys goofing around in the middle of a suburban street at sunset, one held upside down over another boy shoulder', width: 3899, height: 5841, category: 'portraits' },
  { src: '/photos/portrait-10.jpg', alt: 'Bearded man in a backwards cap crouched on the asphalt at dusk, shot wide against a deep blue sky and power lines', width: 6016, height: 4016, category: 'portraits' },
  { src: '/photos/comedy-09.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/music-01.jpg', alt: 'Five band members lounging across a couch in a green-lit garage, an acoustic guitar hanging on the wall behind them', width: 6016, height: 4016, category: 'music' },
  { src: '/photos/comedy-10.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/music-02.jpg', alt: 'Rapper mid-verse with one arm raised, stage lights streaking outward behind him in a zoom blur', width: 6016, height: 4016, category: 'music' },
  { src: '/photos/comedy-11.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/comedy-12.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/comedy-13.jpg', alt: 'Mustached comedian on stage smiling and gesturing while holding out a microphone by its cable', width: 6016, height: 4016, category: 'comedy' },
  { src: '/photos/portrait-11.jpg', alt: 'Man with dreadlocks and a plaid shirt looking back over his shoulder against city lights at night', width: 6016, height: 4016, category: 'portraits' },
  { src: '/photos/portrait-12.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670, category: 'portraits' },
  { src: '/photos/portrait-13.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1297, height: 1748, category: 'portraits' },
  { src: '/photos/comedy-14.jpg', alt: 'Musician singing into a microphone while playing a sticker-covered acoustic guitar under a stage spotlight, inside a thin white frame', width: 1122, height: 1402, category: 'comedy', project: 'framed', projectOrder: 4 },
];
