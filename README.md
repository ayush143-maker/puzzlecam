# puzzlecam

A TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Browser-based vision interactions may require camera access; further interface controls or behaviors are not specified here.

The project source is in `src`. The root-level `package.json` provides the npm commands below. The Next.js, PostCSS, Tailwind CSS, and TypeScript configuration files are `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, and `tsconfig.json`.

## Run locally

From the project folder, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local address printed by the server. If prompted, allow camera access in your browser. To review a change, edit the relevant source in `src` and view it in the browser while the development server is running.

To create a production build and run it locally, use:

```sh
npm run build
npm start
```

If a camera feature does not start, check browser permissions, device availability, and the MediaPipe setup in the source. No deployment provider or production hosting configuration is specified.