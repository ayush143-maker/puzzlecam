# puzzlecam

A TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Browser-based vision interactions may require camera access; check the source for the exact controls and behavior.

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

## Configuration and data handling

The supplied root-file list includes application configuration files but no `.env` or `.env.example` file, and no environment-variable names or backend configuration are documented here. Treat tracked configuration such as `next.config.mjs` as public source: do not add credentials, tokens, or other secrets to it or to client-side code. If you later find a local secrets template or introduce environment-based configuration, keep the template limited to placeholder names and commit no real values; review `.gitignore` and repository status before committing local files. Do not assume an environment variable or server-side secret is required unless the source establishes it.

Camera access can expose live imagery from the user's surroundings. Before using the app with sensitive surroundings, inspect the relevant code in `src` and the MediaPipe setup to determine whether frames are processed locally, transmitted, or stored; this README does not establish those details. Request camera access only when needed, explain the use to users, and check the behavior when permission is denied or revoked. Do not treat browser-delivered code or values as secret.

## Browser and platform review checklist

These are actions to perform, not verified compatibility results or performance measurements. Record the browsers, versions, devices, and findings separately; this README does not claim that testing has been completed.

- [ ] Start the app and open its root page at the local address printed by the development server. Inspect `src` to identify the page, components, and resources involved.
- [ ] Check the experience in current stable browsers relevant to this Next.js, React, and MediaPipe Tasks Vision app and its intended audience. Include mobile and desktop browsers where applicable; do not infer support for a browser or device that was not checked.
- [ ] In each browser, inspect the developer console for errors and warnings. Use the Network panel to check failed requests, unexpected redirects, and resources that do not load, including requests associated with the vision setup.
- [ ] Inspect the page and source for image, audio, video, camera, font, and other resource references. Check that every referenced local path resolves from the file using it, and review external URLs for correct and intentional requests.
- [ ] Confirm that referenced assets are used before retaining them; remove files only after checking imports and other references. Consider whether large media is necessary before adding it, without treating this as a measured performance result.
- [ ] Try the interactions actually presented by the interface. If it requests camera access, review the permission prompt and camera flow with an available device. Check behavior when permission is denied or no camera is available, where the implementation provides a relevant flow; do not assume controls or outcomes beyond what the source and page describe.
- [ ] Inspect the page at narrow mobile and wide desktop viewport sizes. Check that the camera-oriented interface and visible controls remain accessible, and note overflow or layout issues. Where possible, also check on an actual mobile device, including its camera permission flow.
- [ ] After a change, reload the app and repeat the checks affected by that change.

## Accessibility review checklist

Perform these as future checks of the rendered interface and relevant components in `src`; they are not verified results:

- Test the camera-oriented interface with a keyboard. Check that every visible control is reachable and operable, and that focus is easy to see against the camera or preview area.
- Check that camera permissions, camera controls, and other visible controls have meaningful labels and that status or error feedback is understandable without relying only on visual changes.
- Review text and control contrast in the interface, including overlays and content shown against a live or captured camera image.
- If the interface displays images or video frames as content, check whether informative visual content needs a text alternative or equivalent description; do not assume a camera feed already has one.
- If camera effects, transitions, or other motion are used, check that they respect the user's reduced-motion preference.

## Personalize the interface

- Find the relevant page or component in `src` before editing visible text or interface elements; the root file list does not identify specific source files or asset names.
- The repository includes `tailwind.config.ts` and `postcss.config.mjs`. Review their current contents before changing styling-related settings rather than assuming which theme options or utilities the app uses.
- Before adding or moving images or other assets, inspect the source for existing imports and URL references. Keep paths valid relative to the files that use them, and update those references if files move.