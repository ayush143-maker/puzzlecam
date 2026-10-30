# puzzlecam

A TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Camera-based interactions may require browser permission; consult the source for exact controls and behavior.

Application source is in `src`. Root configuration files include `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, and `tsconfig.json`. The root `package.json` provides these npm commands:

## Run locally

From the project folder:

```sh
npm install
npm run dev
```

Open the local address printed by the server. If prompted, allow camera access. To create and run a production build locally:

```sh
npm run build
npm start
```

## Integration and data handling

The supplied root-file list includes no `.env` or `.env.example` file and documents no environment-variable names or backend configuration. Treat tracked configuration and client-side code as public; do not add credentials, tokens, or secrets. If environment configuration is introduced, document only settings used by the source and keep real values out of tracked files. Review `.gitignore` and repository status before committing local files.

Camera access can expose live imagery from a user's surroundings. Inspect the relevant code in `src` and the MediaPipe setup to determine whether frames are processed locally, transmitted, or stored; this README does not establish those details. Review permission-denied and unavailable-camera behavior against the actual implementation.

## Troubleshooting

These are diagnostic suggestions, not reports of known failures:

- Inspect `src` to find the page or component involved, then check its imports and resource references if content is missing.
- Use the browser Console and Network panel to investigate errors and failed requests, including requests related to vision setup.
- Check camera permission, device availability, and the MediaPipe setup if camera interaction does not proceed. Do not assume a particular fallback flow without checking the implementation.

## Contributor handoff

Keep changes focused on the relevant page, component, or configuration. Preserve existing filenames and relative imports or asset references; if a file moves, update the references that depend on it. In your handoff, describe what changed and which parts of `src` or configuration were affected. Before publishing, manually review the diff and inspect the affected interface and behavior locally. The checklist below is for review, not a report of verified results.

### Review checklist

- [ ] Review the affected page, components, and resource references under `src`.
- [ ] If camera behavior changed, consider permission granted, denied, and unavailable-device cases where the implementation supports them.
- [ ] Check the browser Console and Network panel for relevant errors or failed requests.
- [ ] Review keyboard access, focus, labels, feedback, and layout at relevant viewport sizes.
