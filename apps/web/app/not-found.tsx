import type { Metadata } from "next";
import { NotFoundView } from "../components/NotFoundView";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { copy } from "../content/site";

export const metadata: Metadata = {
  title: "404 — Page not found | Lana Fox",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <a className="skipLink" href="#main-content">
        {copy.en.skip}
      </a>
      <SiteHeader locale="en" />
      <main id="main-content">
        <NotFoundView />
      </main>
      <SiteFooter locale="en" />
    </>
  );
}

