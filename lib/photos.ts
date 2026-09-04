import type { Photo } from '@/lib/masonry';

export type { Photo };

/*
 * Photos are named by the section they belong to - comedy-NN, portrait-NN,
 * music-NN - and tx-NN for the few that suit no section and appear on
 * the home page only. The numbering is just folder order within each
 * section; it carries no meaning, so a photo can be renumbered or a gap left
 * without anything caring.
 *
 * Every list below is split into a vertical block and a horizontal block,
 * because shape is what the layout actually reacts to: the rails are built
 * from vertical photos, the horizontal ones fill the grid and set how often
 * a rail comes round. Having them apart makes it obvious what moving a photo
 * will cost. Within each block they run by section, then by name.
 *
 * A photo is listed twice - once in featuredPhotos, once in its section's
 * array - so a rename or a caption fix has to be made in both.
 */

/**
 * The order the mobile home page opens with, by filename. These run first
 * and in this sequence, ahead of everything the interleaving and rail
 * cadence decide; add to the list to fix more of the opening, remove to hand
 * a photo back to the normal flow.
 *
 * Mobile only - desktop is left to its own interleaved order.
 *
 * A vertical photo named here is spent on the opening and can no longer fill
 * a rail, and rails are built from vertical photos, so each one costs a rail
 * photo. The framed project below claims every one of its own tagged
 * photos for the first rail regardless of railSize (see pickRail in
 * lib/masonry.ts - a project is a curated set, not capped the way an
 * ordinary same-shape group is); everything else unpinned and vertical
 * splits across the uniform rails MOBILE_RAIL_SIZE at a time, short by
 * however many that supply doesn't divide evenly. No fixed count is kept
 * here on purpose - it drifts every time a photo is added or removed, and
 * a stale number is worse than none; run the page (or see chunkWithRails)
 * to check current supply. Horizontal photos cost nothing - pin as many as
 * you like. (Shape, not section: a photo filed under comedy can still be
 * rail supply.)
 */
export const MOBILE_LEAD: string[] = [
  '/photos/portrait-03.jpg',
  '/photos/music-02.jpg',
  '/photos/portrait-08.jpg',
  '/photos/portrait-10.jpg',
  '/photos/portrait-07.jpg',
  '/photos/portrait-04.jpg',
  '/photos/portrait-11.jpg',
];

/**
 * The counterpart to MOBILE_LEAD at the other end of the page: these run as
 * their own grid segment immediately before the final rail, so the last two
 * rails are separated by photos instead of sitting flush against each other.
 *
 * Mobile only, and named here rather than ordered into the list below
 * because array order cannot express it. What is left over by the time the
 * last rail comes round is decided by interleaveByCategory, not by this
 * file - a category holding only a photo or two has each of them picked
 * early wherever they sit in the array, so they cannot be moved to the end
 * by reordering. Naming them is the only way to choose them.
 *
 * Costs what MOBILE_LEAD costs: a photo shows in one place only, so a
 * vertical pinned here is one the rails can no longer use.
 */
export const MOBILE_TAIL: string[] = [
  '/photos/comedy-03.jpg',
  '/photos/music-01.jpg',
  '/photos/portrait-06.jpg',
];

/**
 * The photos that close the mobile page, placed after the final rail so the
 * gallery doesn't end on a full-bleed pinned run. Same mechanism and same
 * cost as MOBILE_LEAD and MOBILE_TAIL - a photo shows in one place only.
 */
export const MOBILE_CODA: string[] = [
  '/photos/portrait-16.jpg',
  '/photos/comedy-02.jpg',
];

/**
 * Every photo the home page can show, tagged by section so it can interleave
 * them (see interleaveByCategory in lib/masonry.ts) instead of clumping one
 * section together. The tx-NN photos carry no tag: they suit no
 * section, and untagged photos are appended after the tagged ones rather
 * than dropped.
 *
 * Order here matters for desktop. The interleaving rotates through the
 * sections and takes the next unused photo of the wanted shape from each, so
 * a photo's place within its own section and shape decides how early it
 * comes up - moving one higher moves it earlier on the desktop page. It has
 * no such effect on mobile, where MOBILE_LEAD sets the opening and the rest
 * follows the rail cadence.
 */
export const featuredPhotos: Photo[] = [
  // vertical
  { src: '/photos/comedy-04.jpg', alt: 'Stylized portrait of a smiling man in a backwards cap and gold chains throwing a peace sign, composited over a stormy city skyline lit by lightning', width: 1122, height: 1402, category: 'comedy', project: 'framed', projectOrder: 2 },
  { src: '/photos/comedy-05.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402, category: 'comedy', project: 'framed', projectOrder: 1 },
  { src: '/photos/comedy-07.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him, inside a thin white frame', width: 2670, height: 3336, category: 'comedy', project: 'framed', projectOrder: 6 },
  { src: '/photos/comedy-08.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700, category: 'comedy', project: 'framed', projectOrder: 3 },
  { src: '/photos/comedy-14.jpg', alt: 'Musician singing into a microphone while playing a sticker-covered acoustic guitar under a stage spotlight, inside a thin white frame', width: 1122, height: 1402, category: 'comedy', project: 'framed', projectOrder: 5 },
  { src: '/photos/comedy-18.jpg', alt: 'Wide-eyed, laughing comedian in a yellow tropical-print shirt, framed inset over a blurred black-and-white crowd', width: 1080, height: 1350, category: 'comedy', project: 'framed', projectOrder: 7 },
  { src: '/photos/comedy-19.jpg', alt: 'Comedian with long curly hair and a mustache holding a microphone on the Austin Comedy Company stage, framed inset over a blurred crowd', width: 1080, height: 1350, category: 'comedy', project: 'framed', projectOrder: 8 },
  { src: '/photos/comedy-21.jpg', alt: 'Man with a strawberry-blond mullet, mustache, and neck tattoos tilting his head back in a patterned western snap shirt, inside a thin white frame', width: 3799, height: 4749, category: 'comedy', project: 'framed', projectOrder: 4 },
  { src: '/photos/comedy-02.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000, category: 'comedy' },
  { src: '/photos/portrait-03.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000, category: 'portraits' },
  { src: '/photos/portrait-01.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972, category: 'portraits', project: 'series-two', projectOrder: 3 },
  { src: '/photos/portrait-02.jpg', alt: 'Blonde woman in a navy fur coat glancing back beneath a canopy of blue string lights in a city alley', width: 3615, height: 5423, category: 'portraits', project: 'series-two', projectOrder: 2 },
  { src: '/photos/portrait-04.jpg', alt: 'Portrait photograph', width: 5444, height: 8000, category: 'portraits' },
  { src: '/photos/portrait-05.jpg', alt: 'Woman in a white ruffled dress and studded denim jacket posing with blue cat-eye sunglasses among balloons in purple and blue light', width: 3534, height: 5293, category: 'portraits', project: 'series-two', projectOrder: 1 },
  { src: '/photos/portrait-06.jpg', alt: 'Three boys goofing around in the middle of a suburban street at sunset, one held upside down over another boy shoulder', width: 3899, height: 5841, category: 'portraits' },
  { src: '/photos/portrait-07.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1297, height: 1748, category: 'portraits' },
  { src: '/photos/portrait-08.jpg', alt: 'Woman in a leopard-print bodysuit and sunglasses crouching in front of a graffiti mural, glancing back over her shoulder', width: 3924, height: 5878, category: 'portraits' },
  { src: '/photos/portrait-16.jpg', alt: 'Couple kissing at the rail of a boat as the sun sets over open water behind them', width: 3850, height: 5767, category: 'portraits' },
  { src: '/photos/tx-01.jpg', alt: 'Sheer canyon walls catching low sun above a still green river that mirrors them', width: 8000, height: 12000, project: 'tx', projectOrder: 4 },
  { src: '/photos/tx-02.jpg', alt: 'Boy in a straw cowboy hat carrying a Texas flag across the granite dome of Enchanted Rock', width: 2688, height: 4032, project: 'tx', projectOrder: 1 },
  { src: '/photos/tx-03.jpg', alt: 'Portrait of Willie Nelson projected in light onto the side of an old bus under a starry night sky', width: 4365, height: 6548, project: 'tx', projectOrder: 5 },
  { src: '/photos/tx-05.jpg', alt: 'Texas longhorn with sweeping horns leaning against a barbed-wire fence, suburban rooftops behind it', width: 3712, height: 5568, project: 'tx', projectOrder: 3 },
  { src: '/photos/tx-06.jpg', alt: 'Kayakers scattered across Lady Bird Lake at dusk below the downtown Austin skyline', width: 4006, height: 6001, project: 'tx', projectOrder: 7 },
  { src: '/photos/tx-07.jpg', alt: 'Turquoise Rio Grande winding between the sheer limestone walls of Santa Elena Canyon in Big Bend', width: 8308, height: 12464, project: 'tx', projectOrder: 6 },
  { src: '/photos/tx-08.jpg', alt: 'Desert highway curving toward a sunlit peak in Big Bend at sunset', width: 5678, height: 8518, project: 'tx', projectOrder: 2 },

  // horizontal
  { src: '/photos/comedy-10.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/comedy-12.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670, category: 'comedy' },
  { src: '/photos/portrait-09.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048, category: 'portraits' },
  { src: '/photos/portrait-10.jpg', alt: 'Bearded man in a backwards cap crouched on the asphalt at dusk, shot wide against a deep blue sky and power lines', width: 6016, height: 4016, category: 'portraits' },
  { src: '/photos/portrait-11.jpg', alt: 'Man with dreadlocks and a plaid shirt looking back over his shoulder against city lights at night', width: 6016, height: 4016, category: 'portraits' },
  { src: '/photos/portrait-12.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670, category: 'portraits' },
  { src: '/photos/portrait-15.jpg', alt: 'Two men in sunglasses laughing together in a swimming pool, a French bulldog watching from the lawn behind them outside a modern glass house', width: 2304, height: 1536, category: 'portraits' },
  { src: '/photos/music-02.jpg', alt: 'Rapper mid-verse with one arm raised, stage lights streaking outward behind him in a zoom blur', width: 6016, height: 4016, category: 'music' },
  { src: '/photos/comedy-03.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 1080, height: 1080, category: 'comedy' },
  { src: '/photos/music-01.jpg', alt: 'Five band members lounging on a couch in a green-lit garage, their eyes glowing white, an acoustic guitar hanging on the wall behind them', width: 5241, height: 3169, category: 'music' },
];

export const comedyPhotos: Photo[] = [
  // vertical
  { src: '/photos/comedy-01.jpg', alt: 'Stacked portrait of three comedians in caps, lit in purple and green', width: 1929, height: 2600 },
  { src: '/photos/comedy-02.jpg', alt: 'Distorted composite portrait of a man in a cap and sweatshirt, his face warped by a motion-blur effect', width: 3000, height: 4000 },
  { src: '/photos/comedy-03.jpg', alt: 'Black and white portrait of a smiling, mustached comedian double-exposed with a laughing audience crowd', width: 1080, height: 1080 },
  { src: '/photos/comedy-04.jpg', alt: 'Stylized portrait of a smiling man in a backwards cap and gold chains throwing a peace sign, composited over a stormy city skyline lit by lightning', width: 1122, height: 1402, project: 'framed', projectOrder: 2 },
  { src: '/photos/comedy-05.jpg', alt: 'Stylized portrait of a man in a leather jacket and sunglasses composited over a black-and-white crowd scene', width: 1122, height: 1402, project: 'framed', projectOrder: 1 },
  { src: '/photos/comedy-15.jpg', alt: 'Comedian gritting his teeth and squinting while pointing a corded microphone at the camera', width: 3712, height: 5568 },
  { src: '/photos/comedy-07.jpg', alt: 'Black and white portrait of a bald, bearded comedian in sunglasses and a plaid shirt, smoke curling beside him, inside a thin white frame', width: 2670, height: 3336, project: 'framed', projectOrder: 6 },
  { src: '/photos/comedy-08.jpg', alt: 'Stylized portrait of a comedian lighting a cigarette, framed inset over a smoky black-and-white background of the same scene', width: 2160, height: 2700, project: 'framed', projectOrder: 3 },
  { src: '/photos/comedy-14.jpg', alt: 'Musician singing into a microphone while playing a sticker-covered acoustic guitar under a stage spotlight, inside a thin white frame', width: 1122, height: 1402, project: 'framed', projectOrder: 5 },
  { src: '/photos/comedy-16.jpg', alt: 'Comedian in a backwards cap and tan hoodie mid-joke on a stool, a longhorn-cattle backdrop lit behind him', width: 3954, height: 5051 },
  { src: '/photos/comedy-17.jpg', alt: 'Comedian in a black t-shirt pointing toward the crowd mid-joke, framed inset over a blurred black-and-white shot of the Austin Comedy Company stage', width: 1080, height: 1350 },
  { src: '/photos/comedy-18.jpg', alt: 'Wide-eyed, laughing comedian in a yellow tropical-print shirt, framed inset over a blurred black-and-white crowd', width: 1080, height: 1350, project: 'framed', projectOrder: 7 },
  { src: '/photos/comedy-19.jpg', alt: 'Comedian with long curly hair and a mustache holding a microphone on the Austin Comedy Company stage, framed inset over a blurred crowd', width: 1080, height: 1350, project: 'framed', projectOrder: 8 },
  { src: '/photos/comedy-21.jpg', alt: 'Man with a strawberry-blond mullet, mustache, and neck tattoos tilting his head back in a patterned western snap shirt, inside a thin white frame', width: 3799, height: 4749, project: 'framed', projectOrder: 4 },

  // horizontal
  { src: '/photos/comedy-09.jpg', alt: 'Comedian in a cap speaking into a microphone during his set', width: 4000, height: 2670 },
  { src: '/photos/comedy-10.jpg', alt: 'Black and white portrait of a comedian in a flat cap and sunglasses peering through a stage curtain', width: 4000, height: 2670 },
  { src: '/photos/comedy-11.jpg', alt: 'Comedian in a leather jacket on stage as the audience claps', width: 4000, height: 2670 },
  { src: '/photos/comedy-12.jpg', alt: 'Comedian mid-joke on stage gesturing with his hand, lit in blue stage light', width: 4000, height: 2670 },
  { src: '/photos/comedy-13.jpg', alt: 'Mustached comedian on stage smiling and gesturing while holding out a microphone by its cable', width: 6016, height: 4016 },
];

export const portraitPhotos: Photo[] = [
  // vertical
  { src: '/photos/portrait-03.jpg', alt: 'Two women in elaborate Day of the Dead costumes standing in a desert canyon', width: 2666, height: 4000 },
  { src: '/photos/portrait-01.jpg', alt: 'Woman walking away toward a sunlit overlook at golden hour', width: 3981, height: 5972, project: 'series-two', projectOrder: 3 },
  { src: '/photos/portrait-02.jpg', alt: 'Blonde woman in a navy fur coat glancing back beneath a canopy of blue string lights in a city alley', width: 3615, height: 5423, project: 'series-two', projectOrder: 2 },
  { src: '/photos/portrait-04.jpg', alt: 'Portrait photograph', width: 5444, height: 8000 },
  { src: '/photos/portrait-05.jpg', alt: 'Woman in a white ruffled dress and studded denim jacket posing with blue cat-eye sunglasses among balloons in purple and blue light', width: 3534, height: 5293, project: 'series-two', projectOrder: 1 },
  { src: '/photos/portrait-06.jpg', alt: 'Three boys goofing around in the middle of a suburban street at sunset, one held upside down over another boy shoulder', width: 3899, height: 5841 },
  { src: '/photos/portrait-07.jpg', alt: 'Man in black shirt with gold cross necklace seated on a lounge sofa', width: 1297, height: 1748 },
  { src: '/photos/portrait-08.jpg', alt: 'Woman in a leopard-print bodysuit and sunglasses crouching in front of a graffiti mural, glancing back over her shoulder', width: 3924, height: 5878 },
  { src: '/photos/portrait-16.jpg', alt: 'Couple kissing at the rail of a boat as the sun sets over open water behind them', width: 3850, height: 5767 },

  // horizontal
  { src: '/photos/portrait-09.jpg', alt: 'Woman on a phone call beside a vintage phone booth lit in red', width: 3072, height: 2048 },
  { src: '/photos/portrait-10.jpg', alt: 'Bearded man in a backwards cap crouched on the asphalt at dusk, shot wide against a deep blue sky and power lines', width: 6016, height: 4016 },
  { src: '/photos/portrait-11.jpg', alt: 'Man with dreadlocks and a plaid shirt looking back over his shoulder against city lights at night', width: 6016, height: 4016 },
  { src: '/photos/portrait-12.jpg', alt: 'Man with dreadlocks reclining on a wooden bench under dramatic low-key lighting', width: 4000, height: 2670 },
  { src: '/photos/portrait-15.jpg', alt: 'Two men in sunglasses laughing together in a swimming pool, a French bulldog watching from the lawn behind them outside a modern glass house', width: 2304, height: 1536 },
];

export const musicPhotos: Photo[] = [
  // horizontal
  { src: '/photos/music-01.jpg', alt: 'Five band members lounging on a couch in a green-lit garage, their eyes glowing white, an acoustic guitar hanging on the wall behind them', width: 5241, height: 3169 },
  { src: '/photos/music-02.jpg', alt: 'Rapper mid-verse with one arm raised, stage lights streaking outward behind him in a zoom blur', width: 6016, height: 4016 },
];
