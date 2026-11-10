import policies from "../content/policies.json";
import review from "../content/review.json";
import { copy, type Locale } from "../content/site";
import styles from "./PolicyDocument.module.css";

type PolicyKind = "privacy-policy" | "terms-and-conditions";
type PolicySection = [string, string[]];

export function PolicyDocument({
  locale,
  kind,
}: {
  locale: Locale;
  kind: PolicyKind;
}) {
  const t = copy[locale];
  const title = kind === "privacy-policy" ? t.privacy : t.terms;
  const sections = policies[locale][kind] as unknown as PolicySection[];

  return (
    <article className={styles.wrapper}>
      <h1 className={styles.heading}>{title}</h1>

      {!review.policiesApproved && (
        <p className={styles.reviewNotice} role="note">
          {t.policy}
        </p>
      )}

      {sections.map(([sectionTitle, paragraphs]) => (
        <section key={sectionTitle} className={styles.section}>
          <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
          {paragraphs.map((p, idx) => (
            <p key={idx} className={styles.paragraph}>
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

