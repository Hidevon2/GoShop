// Vercel discovers serverless functions from the root api/ directory.
// Keep the implementation inside backend/ and re-export it here for routing.
export { default } from "../backend/api/handler.js";
