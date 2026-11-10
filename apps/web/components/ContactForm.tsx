"use client";

import { useState, type FormEvent } from "react";
import { contactSchema } from "@lanafox/contracts";
import { copy, site, type Locale } from "../content/site";
import { apiUrl } from "../lib/api";
import styles from "./ContactForm.module.css";

function createDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000";
}

export function ContactForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const endpoint = apiUrl("/api/contact");
  const isLocalEndpoint =
    endpoint.includes("localhost") || endpoint.includes("127.0.0.1");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submissionId, setSubmissionId] = useState<string>(() => createDraftId());
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">(
    "idle",
  );
  const [previewDelivery, setPreviewDelivery] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "pending") return;

    const parsed = contactSchema.safeParse({
      name,
      email,
      message,
      locale,
      website,
      submissionId,
    });

    if (!parsed.success) {
      setStatus("error");
      return;
    }

    setStatus("pending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      const body = (await res.json().catch(() => ({}))) as {
        status?: string;
        delivery?: string;
      };
      setPreviewDelivery(body.delivery === "preview" || isLocalEndpoint);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={styles.heroBackdrop}>
      <div className={styles.card}>
        <h1 className={styles.heading}>{t.contact}</h1>

        {isLocalEndpoint && (
          <div
            className={styles.previewBanner}
            data-testid="local-inbox-notice"
          >
            {locale === "uk" ? (
              <>
                <strong>Локальний режим перегляду:</strong> реальні електронні
                листи не надсилаються. Повідомлення зберігаються лише у
                тимчасовій локальній скриньці (
                <code>http://localhost:7071/__test/inbox</code>).
              </>
            ) : (
              <>
                <strong>Local preview mode:</strong> no real email is sent.
                Messages stay only in the temporary loopback test inbox (
                <code>http://localhost:7071/__test/inbox</code>).
              </>
            )}
          </div>
        )}

        {status === "success" ? (
          <div className={styles.alertSuccess} role="status">
            <p className={styles.alertTitle}>{t.success}</p>
            <p>
              {previewDelivery
                ? locale === "uk"
                  ? "Запис збережено в локальній тестовій скриньці (лист не надсилався)."
                  : "Recorded in the local preview test inbox (no email was sent)."
                : locale === "uk"
                  ? "Ми зв’яжемось із Вами якомога швидше."
                  : "We will reach you as soon as possible."}
            </p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setName("");
                setEmail("");
                setMessage("");
                setWebsite("");
                setSubmissionId(createDraftId());
                setStatus("idle");
              }}
            >
              {locale === "uk" ? "Надіслати ще одне" : "Send another message"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} aria-busy={status === "pending"}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="contact-name">
                {t.name}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                className={styles.input}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="contact-email">
                {t.email}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className={styles.input}
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="contact-message">
                {t.message}
              </label>
              <textarea
                id="contact-message"
                name="message"
                className={styles.textarea}
                rows={6}
                required
                minLength={10}
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={status === "pending"}
            >
              {status === "pending" ? t.pending : t.send}
            </button>

            {status === "error" && (
              <div className={styles.alertError} role="alert">
                {t.error}{" "}
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
