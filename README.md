# puzzlecam

A Next.js and React application with a camera-oriented interface and a dependency on MediaPipe Tasks Vision. Camera access may be needed for its browser-based vision interactions.

## Run locally

From the project folder, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local address printed by the development server. Allow camera permission in a compatible browser when prompted.

To create and run a production build:

```sh
npm run build
npm start
```

If a camera feature does not start, check browser permissions, device availability, and the MediaPipe setup in the source.