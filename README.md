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

## Personalize the interface

- Find the relevant page or component in `src` before editing visible text or interface elements; the root file list does not identify specific source files or asset names.
- The repository includes `tailwind.config.ts` and `postcss.config.mjs`. Review their current contents before changing styling-related settings rather than assuming which theme options or utilities the app uses.
- Before adding or moving images or other assets, inspect the source for existing import statements and URL references. Keep their paths valid relative to the files that use them, and update those references if files move.

**Review suggestion:** Check the existing source and configuration to identify where this app defines its theme, visible copy, and any assets before documenting more specific customization steps.