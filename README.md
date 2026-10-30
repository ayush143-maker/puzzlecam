# puzzlecam

A TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Browser-based vision interactions may require camera access; the exact interface controls and behaviors should be checked in the source rather than assumed.

The project source is in `src`. The root-level `package.json` provides the npm commands below. The Next.js, PostCSS, Tailwind CSS, and TypeScript configuration files are `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, and `tsconfig.json`.

## Run locally

From the project folder, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local address printed by the server. If prompted, allow camera access in your browser. To create a production build and run it locally, use:

```sh
npm run build
npm start
```

If a camera feature does not start, check browser permissions, device availability, and the MediaPipe setup in the source. No deployment provider or production hosting configuration is specified.

## Manual review checklist

These are actions to perform, not verified results. Record findings separately; this README does not report that the checks have passed.

- [ ] Start the app and open its root page at the local address printed by the development server. Inspect `src` to identify the page and its referenced components.
- [ ] Inspect the page and source for image, video, camera, and other media references. Check that each referenced local path resolves and that any external URL can be reached.
- [ ] Try the interactions actually presented by the interface. If the app requests camera access, test the permission prompt and camera flow with an available device; do not assume additional controls or outcomes beyond what the source and page describe.
- [ ] Inspect the page at a narrow viewport and a wide viewport. Check that the camera-oriented interface and its visible controls remain accessible and note overflow or layout issues.
- [ ] After a change, reload the app and repeat the checks affected by that change.

## Personalize the interface

- Find the relevant page or component in `src` before editing visible text or interface elements; the root file list does not identify specific source files or asset names.
- The repository includes `tailwind.config.ts` and `postcss.config.mjs`. Review their current contents before changing styling-related settings rather than assuming which theme options or utilities the app uses.
- Before adding or moving images or other assets, inspect the source for existing import statements and URL references. Keep their paths valid relative to the files that use them, and update those references if files move.