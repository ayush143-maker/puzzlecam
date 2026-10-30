# puzzlecam

A TypeScript Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Camera-based interactions may require browser permission; consult the source for exact controls and behavior.

Application source is in `src`. Root configuration files include `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, and `tsconfig.json`. The root `package.json` is present. The supplied project notes list these npm commands:

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

## Deployment-readiness checklist

The following are recommendations for preparing and reviewing a publication; they are not claims that the app has been published or verified in a particular environment.

- [ ] **Use the project root.** Set the project root to the folder containing `package.json`, `next.config.mjs`, and `src`. Confirm that the build process is run from that folder and that the publishing configuration points to the intended application, not just the `src` directory.
- [ ] **Verify the output and runtime requirements.** Inspect `package.json` and `next.config.mjs` to confirm the actual build scripts and output settings before selecting a publishing output directory or runtime mode. Do not assume a static output folder or copy `src` as the finished site; use the output and requirements established by the project configuration. The supplied information does not establish a particular deployment target or output directory.
- [ ] **Preserve imports and asset references.** Review imports and resource references under `src` for paths that depend on the project structure. If files move, update the references that depend on them. Check the browser Network panel after building or publishing for missing resources, including requests related to vision setup.
- [ ] **Keep configuration safe.** The supplied root-file list includes no `.env` or `.env.example` file and documents no environment-variable names or backend configuration. Treat tracked configuration and client-side code as public; do not add credentials, tokens, or secrets. If environment configuration is introduced, document only settings used by the source and keep real values out of tracked files. Review `.gitignore` and repository status before committing local files.
- [ ] **Review camera and data handling.** Camera access can expose live imagery from a user's surroundings. Inspect the relevant code in `src` and the MediaPipe setup to determine whether frames are processed locally, transmitted, or stored. Review permission-denied and unavailable-camera behavior against the actual implementation; this README does not establish those details.
- [ ] **Preview after publishing.** Open the published preview and check that the expected page loads, resources resolve, and relevant interactions work. Inspect the browser Console and Network panel for errors or failed requests. If camera behavior is involved, review permission granted, denied, and unavailable-device cases where the implementation supports them. Do not assume a particular fallback flow without checking the source.
- [ ] **Review the interface.** Check keyboard access, focus, labels, feedback, and layout at relevant viewport sizes, especially for areas changed during the update.

## Troubleshooting

These are diagnostic suggestions, not reports of known failures:

- Inspect `src` to find the page or component involved, then check its imports and resource references if content is missing.
- Use the browser Console and Network panel to investigate errors and failed requests, including requests related to vision setup.
- Check camera permission, device availability, and the MediaPipe setup if camera interaction does not proceed. Do not assume a particular fallback flow without checking the implementation.

## Contributor handoff

Keep changes focused on the relevant page, component, or configuration. In your handoff, describe what changed and which parts of `src` or configuration were affected. Before publishing, manually review the diff and inspect the affected interface and behavior locally. The checklists above are for review, not reports of verified results.

## Final release review

- Confirm the documented starting point still matches the files present at the repository root.
- Check the scripts and dependency versions in `package.json`; use the repository's declared workflow rather than assuming a generic build command.
- Review the published result once on a narrow screen and once on a wider screen; treat this as a release check, not an automated test report.
