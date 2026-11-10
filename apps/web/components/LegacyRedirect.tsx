"use client";

import { useEffect } from "react";
import { href, type Slug } from "../content/site";

export function LegacyRedirect({ slug }: { slug: Slug }) {
  const defaultTarget = href("en", slug);
  const ukTarget = href("uk", slug);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("lang") === "uk" ? ukTarget : defaultTarget;
    window.location.replace(target);
  }, [defaultTarget, ukTarget]);

  return (
    <div style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1.5rem", textAlign: "center" }}>
      <meta httpEquiv="refresh" content={`0;url=${defaultTarget}`} />
      <p>
        Redirecting to <a href={defaultTarget}>{defaultTarget}</a> ·{" "}
        <a href={ukTarget} lang="uk">
          Українська версія ({ukTarget})
        </a>
      </p>
    </div>
  );
}

