// start.ts
// Minimal TanStack Start configuration. No custom server middleware is
// needed for this app — everything runs client-side against mock data.
import { createStart } from "@tanstack/react-start";
export const startInstance = createStart(() => ({}));
