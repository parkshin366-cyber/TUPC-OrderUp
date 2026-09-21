// Set EXPO_PUBLIC_API_URL in the root .env, e.g.
// EXPO_PUBLIC_API_URL=https://your-name.ngrok-free.app   (no trailing slash)
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// Skips ngrok's browser warning page, which would otherwise break the WebView.
export const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };