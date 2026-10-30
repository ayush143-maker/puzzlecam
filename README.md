# puzzlecam

A Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Camera access may be required for its browser-based vision interactions.

## Run locally

Install dependencies and start the development server:

    npm install
    npm run dev

Create a production build with:

    npm run build

The package also provides `npm start` to serve the built application.

## Camera access

Allow camera permission in a compatible browser when prompted. If a camera feature does not start, check browser permissions, device availability, and the MediaPipe setup in the source.