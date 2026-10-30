# puzzlecam

`puzzlecam` is a TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Camera-based interactions may require browser permission. Consult the application source for the exact controls and behavior; the supplied project information does not establish camera-data handling or a specific permission fallback.

## Run locally

From the project folder, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local address printed by the server. If prompted, allow camera access.

To create and run a production build locally:

```sh
npm run build
npm start
```

## Project structure

- `src` — application source.
- `package.json` — dependencies and declared npm scripts.
- `next.config.mjs` — Next.js configuration.
- `postcss.config.mjs`, `tailwind.config.ts` — styling-related configuration.
- `tsconfig.json` — TypeScript configuration.

Run commands from the project root, where `package.json`, `next.config.mjs`, and `src` are located. Check `package.json` and `next.config.mjs` for the project’s actual build and output settings; no deployment target or output directory is established here. Do not assume that copying `src` produces a finished site.

## Camera and configuration considerations

Review the relevant code in `src` and the MediaPipe setup to determine how camera frames are processed, whether they are transmitted or stored, and how permission denial or unavailable devices are handled. This README does not establish those details.

The supplied project information does not document environment-variable names or backend configuration. Keep credentials and other secrets out of tracked files and client-side code. When reviewing a built or published application, check the browser Console and Network panel for errors and failed resource requests, including those related to vision setup. Verify camera behavior against the implementation rather than assuming a particular fallback.