# Archive

Photos taken off the site but kept to revisit or rework. This folder is outside
`public/`, so nothing here is served or deployed.

## comedy-17

`archive/photos/comedy-17.jpg` - removed from the Comedy section.

To bring it back: move the file to `public/photos/` and add this entry to
`comedyPhotos` in `lib/photos.ts` (in the vertical group):

```ts
  { src: '/photos/comedy-17.jpg', alt: 'Comedian in a black t-shirt pointing toward the crowd mid-joke, framed inset over a blurred black-and-white shot of the Austin Comedy Company stage', width: 1080, height: 1350 },
```

## portrait-20

`archive/photos/portrait-20.jpg` - the first edit of the alien tank top / water
reflection shot, taken off the Portraits section because `portrait-22` (a wider
edit of the same frame, used in the HER carousel) replaced it.

To bring it back: move the file to `public/photos/` and add this entry to
`portraitPhotos` in `lib/photos.ts`:

```ts
  { src: '/photos/portrait-20.jpg', alt: 'Woman in an alien-print tank top and black shorts kneeling over still water, her reflection rippling beneath her, lit in pink and green', width: 1356, height: 2048 },
```

## comedy-27

`archive/photos/comedy-27.jpg` - removed from the Comedy section (too many photos
of the same performer).

To bring it back: move the file to `public/photos/` and add this entry to
`comedyPhotos` in `lib/photos.ts`:

```ts
  { src: '/photos/comedy-27.jpg', alt: 'Comedian in a graphic tee gesturing with open hands at the mic, a few audience members laughing in the dark behind him', width: 2096, height: 1399 },
```
