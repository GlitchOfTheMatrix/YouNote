// routes/index.tsx
// Landing page: hero, URL form, feature highlights, footer. Static content
// lives here; only UrlForm handles interaction.

import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header/Header";
import { UrlForm } from "../components/UrlForm/UrlForm";
import styles from "./index.module.css";

const appName = import.meta.env.VITE_APP_NAME || "YouNote";

const FEATURES = [
  {
    title: "Structured notes",
    body: "Headings, lists, and code blocks — formatted for reading, not a wall of text.",
  },
  {
    title: "Quick summaries",
    body: "Short on time? Get the key takeaways in a tight summary you can skim in seconds.",
  },
  {
    title: "Ask follow-ups",
    body: "Chat about the video while you watch. Answers stay scoped to the transcript.",
  },
];

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.hero}>
        <span className={styles.eyebrow}>From video to notes in seconds</span>
        <h1 className={styles.title}>
          Turn any YouTube video
          <br />
          into <em className={styles.titleAccent}>notes</em> worth reading
        </h1>
        <p className={styles.subtitle}>
          Paste a link. Get clean, structured notes — or a tight summary — generated from the
          video's content. Then ask follow-up questions about anything you missed.
        </p>
        <UrlForm />

        <div className={styles.hints}>
          <span className={styles.hint}>No sign-up</span>
          <span className={styles.hintDot}>·</span>
          <span className={styles.hint}>Works on any public video</span>
          <span className={styles.hintDot}>·</span>
          <span className={styles.hint}>Free</span>
        </div>
      </main>

      <section className={styles.features} aria-labelledby="features-heading">
        <h2 id="features-heading" className={styles.featuresHeading}>
          Everything you need, nothing you don't
        </h2>
        <ul className={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <li key={feature.title} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureBody}>{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          {appName} — YouTube videos, distilled into notes you can keep.
        </p>
      </footer>
    </div>
  );
}
