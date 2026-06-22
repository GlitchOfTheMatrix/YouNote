// router.tsx
// Creates the TanStack Router instance used by both the server and the
// client entry points. A fresh QueryClient is created per request on the
// server (so requests never share cache) and once on the client.
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Notes are expensive (LLM call) — never refetch automatically.
        // Only the Regenerate button should trigger a new backend request.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
  return router;
};
