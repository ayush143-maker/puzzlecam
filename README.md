# puzzlecam

A Next.js and React app with a PuzzleCam interface and MediaPipe Tasks Vision dependency, suggesting a browser-based camera/vision experiment. Camera access may be required for the relevant features.

## Run locally

Install dependencies with npm install, then start the development server with npm run dev. Run npm run build to create a production build.

## Development workflow

Start with the package scripts and the existing source organization. Locate the page or screen component and its imports before changing the UI. Keep shared components and styles consistent rather than duplicating the same behavior in multiple places.

## Validation

Run the development server while iterating, then run the production build before deployment. Check type/build output, browser-console messages, navigation, and the final deployed page. Native-wrapper projects also need a separate on-device test after syncing the web build.
