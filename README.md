# Readme

## Go to

This is an open source, local first progressive web app for speed reading.  This just means instead of having an app, you just visit a webpage and it will cache some information inside your browser so you can reuse it easily.

[Gleaned](https://url)  please try it out and if you like it, buy me a coffee.

# TODO  add the buy me a coffee link from stripe

# TODO The usage should be self explanatory

## Reading Page Modes

The reading page now has two modes:

- Minimal (default): shows only Faster and Slower buttons plus the Back button. The session auto‑starts.
- Debug (optional): shows the full control surface (play/pause, presets, slider, navigation, settings, progress, ORP/key‑term visuals).

To enable Debug mode, append `?debug=1` to the reading page URL:

- Example: `http://localhost:3000/reading.html?debug=1`

This does not change any data; it only exposes additional controls and visuals that are hidden in the default minimal experience.

# TODO the readability should be delivered by the site and not require extra steps

## Offline Readability

For robust article extraction, the app can use Mozilla Readability offline. A shim is provided at `public/vendor/Readability.js` so the app always has a `window.Readability` constructor available.

For best results, replace the shim with the official `Readability.js` from the Mozilla project (MPL-2.0):

1) Download `Readability.js` from <https://github.com/mozilla/readability> (dist UMD build)
2) Save it to `public/vendor/Readability.js` (overwrite the shim)
3) Restart the dev server

Where it’s used:

- Bookmarklet: tries to load `${origin}/vendor/Readability.js` into the page before extraction.
- Ingest page: loads `/vendor/Readability.js` if needed and runs Readability on the received HTML.

If loading fails (e.g., CSP blocking in bookmarklet context), the app falls back to a heuristic cleaner with improved spacing via `innerText` normalization.
