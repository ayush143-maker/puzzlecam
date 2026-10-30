# puzzlecam

A TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Browser-based vision interactions may require camera access; check the source for exact controls and behavior.

The project source is in `src`. The root-level `package.json` provides the npm commands below. Configuration files include `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, and `tsconfig.json`.

## Run locally

From the project folder, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local address printed by the server. If prompted, allow camera access in your browser. To create and run a production build locally:

```sh
npm run build
npm start
```

## Troubleshooting

Use these diagnostic steps, not as claims that a problem is present:

1. Start the app and open the local address printed by the development server. Inspect `src` to identify the page or component you intend to review; the root file list does not specify its exact path.
2. If the page or an asset is missing, check its imports and references. Confirm required local files exist, and preserve relative paths when moving files or update references deliberately.
3. Inspect the browser Console for errors and the Network panel for failed requests or resources that do not load, including requests related to the vision setup.
4. Distinguish local assets from network-dependent resources: verify local paths against the files, and inspect external requests separately. Do not infer that a remote resource loaded simply because it is referenced.
5. If camera interaction does not proceed, check browser permission, device availability, and the MediaPipe setup in `src`. Review behavior when permission is denied or no camera is available without assuming a particular flow.

## Configuration and data handling

The supplied root-file list includes application configuration files but no `.env` or `.env.example` file, and no environment-variable names or backend configuration are documented. Treat tracked configuration such as `next.config.mjs` as public source: do not add credentials, tokens, or secrets to it or client-side code. If environment-based configuration is introduced, document only settings the source actually uses, use placeholders in any template, and keep real values out of tracked files. Review `.gitignore` and repository status before committing local files. Do not assume an environment variable or server-side secret is required unless the source establishes it.

Camera access can expose live imagery from the user's surroundings. Inspect the relevant code in `src` and the MediaPipe setup to determine whether frames are processed locally, transmitted, or stored; this README does not establish those details. Request camera access only when needed, explain its use to users, and check behavior when permission is denied or revoked. Browser-delivered code or values are not secret.

## Browser and platform review checklist

These are actions to perform, not verified compatibility results or performance measurements. Record browsers, versions, devices, and findings separately.

- [ ] Start the app and inspect the page, components, and resources involved under `src`.
- [ ] Check current stable browsers relevant to the Next.js, React, and MediaPipe Tasks Vision app and its intended audience, including mobile and desktop browsers where applicable.
- [ ] Inspect the developer console for errors and warnings. Use the Network panel to check failed requests, redirects, and resources that do not load.
- [ ] Inspect image, audio, video, camera, font, and other resource references. Check local paths and review external URLs for correct and intentional requests.
- [ ] Try interactions actually presented by the interface. If it requests camera access, review the permission prompt and camera flow with an available device; consider denied permission or no camera where the implementation provides a relevant flow.
- [ ] Inspect narrow mobile and wide desktop viewport sizes for usability and overflow. Where possible, also check an actual mobile device, including its camera permission flow.
- [ ] After a change, reload the app and repeat checks affected by that change.

## Accessibility review checklist

These are future checks of the rendered interface and relevant components in `src`, not verified results:

- Test the camera-oriented interface with a keyboard. Check that visible controls are reachable and operable, with clear focus.
- Check that camera permissions, camera controls, and other controls have meaningful labels and that status or error feedback is understandable without relying only on visual changes.
- Review text and control contrast, including overlays and content shown against a live or captured camera image.
- If the interface displays images or video frames as content, consider whether informative visual content needs a text alternative or equivalent description.
- If camera effects, transitions, or other motion are used, check that they respect the user's reduced-motion preference.

## Personalize the interface

Find the relevant page or component in `src` before editing visible text or interface elements. Review `tailwind.config.ts` and `postcss.config.mjs` before changing styling-related settings. Before adding or moving assets, inspect existing imports and URL references; keep paths valid relative to the files that use them and update references if files move. No deployment provider or production hosting configuration is specified.