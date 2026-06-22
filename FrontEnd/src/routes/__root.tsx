// routes/__root.tsx
// Document shell (`shellComponent`) plus app-wide providers (`component`).
// Theme boot script runs in <head> before paint to prevent a flash of the
// wrong theme; ThemeProvider keeps React consumers in sync after hydration.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ThemeProvider } from "../providers/ThemeProvider";
import { THEME_META_COLORS, THEME_STORAGE_KEY } from "../lib/theme";
import { Button } from "../components/Button/Button";
import appCss from "../styles.css?url";
import styles from "./__root.module.css";

const appName = import.meta.env.VITE_APP_NAME || "YouNote";

const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"${THEME_META_COLORS.dark}":"${THEME_META_COLORS.light}");}catch(e){}})();`;

function NotFoundComponent() {
  return (
    <div className={styles.systemPage}>
      <div className={styles.systemCard}>
        <p className={styles.systemCode}>404</p>
        <h1 className={styles.systemTitle}>Page not found</h1>
        <p className={styles.systemText}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/">
          <Button variant="primary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className={styles.systemPage}>
      <div className={styles.systemCard}>
        <h1 className={styles.systemTitle}>This page didn't load</h1>
        <p className={styles.systemText}>
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className={styles.systemActions}>
          <Button
            variant="primary"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Link to="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: appName },
      { name: "description", content: "Turn YouTube videos into AI-generated notes." },
      { property: "og:title", content: appName },
      { property: "og:description", content: "Turn YouTube videos into AI-generated notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: THEME_META_COLORS.light },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
