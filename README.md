# puzzlecam

A TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Its browser-based vision interactions may require camera access; the README does not specify further interface controls or behaviors.

The project source is in `src`. At the root, `package.json` provides the npm commands below, while `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, and `tsconfig.json` configure Next.js, PostCSS, Tailwind CSS, and TypeScript.

## Run and review locally

From the project folder, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local address printed by the development server. Allow camera permission in your browser if prompted. For a small change, edit the relevant source in `src` and review it in the browser while the development server is running.

To create a production build and run it locally, use:

```sh
npm run build
npm start
```

If a camera feature does not start, check browser permissions, device availability, and the MediaPipe setup in the source. The README does not specify a deployment provider or production hosting configuration.