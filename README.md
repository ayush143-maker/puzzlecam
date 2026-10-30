# puzzlecam

**PuzzleCam** is a Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. The project is structured as a browser-based vision experiment, so camera access may be required for the relevant screens or interactions.

## Run locally

Install dependencies and start the development server:

    npm install
    npm run dev

To create a production build, run:

    npm run build

The package also provides npm start for serving the built application.

## Camera access

Open the app in a browser that supports camera access and allow permission when prompted. If a camera-based feature does not start, check the browser permission, device availability, and the relevant MediaPipe setup in the source. Test on a real phone as well as desktop where possible.
