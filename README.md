# puzzlecam

`puzzlecam` is a TypeScript Next.js and React camera experience using MediaPipe Tasks Vision. It turns a live camera feed into a hand-controlled photo puzzle: capture a filtered frame, arrange its nine tiles, and collect up to three completed shots for a downloadable strip.

## Run locally

From the project folder, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local address printed by the server. The app requests camera video at 640×480 with audio disabled. If camera setup or hand-landmarker loading fails, the interface displays `CAMERA ERROR — allow camera access and use https`.

To create and run a production build locally:

```sh
npm run build
npm start
```

## Using the camera puzzle

The app loads a hand landmarker and processes video frames with `detectForVideo`. Its returned hand landmarks drive interactions and a skeleton overlay on the canvas. Pinch with both hands to set a frame, hold steady for one second, then wait through the three-count countdown. The app captures a mirrored crop and applies the DUSK/01 filter: indigo and amber grading, a vignette, lifted blacks, and generated film grain.

The filtered image becomes a nine-piece puzzle. Pinch and drag a tile to move it; release near its target to lock it in place. The interface shows how many of the nine pieces are locked. Completing the puzzle triggers an automatic save after a 900 ms completion flash. The shot is held as a PNG data URL in component/runtime memory, not uploaded to a server or written to durable storage. When the third shot is captured, the app passes the shots to `Strip` with `complete` set to true. Its download handler builds a vertical PNG strip with captions and starts a browser download named `puzzle-cam-strip.png`. The supplied files do not establish the Strip component’s other UI behavior. Reset clears the in-memory shots and returns to tracking.

When the component unmounts, it stops the acquired media-stream tracks. Camera permission and model loading are browser/device dependencies; the displayed error covers setup or loading failures.

## Project files

- `src` — application source.
- `package.json` — dependencies and declared npm scripts.
- `next.config.mjs` — Next.js configuration.
- `postcss.config.mjs`, `tailwind.config.ts` — styling-related configuration.
- `tsconfig.json` — TypeScript configuration.

Run commands from the project root. Check `package.json` and `next.config.mjs` for build and output settings; no deployment target or output directory is established here.