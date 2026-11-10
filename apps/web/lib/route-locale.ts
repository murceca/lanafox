import { notFound } from "next/navigation";
import { locales, type Locale } from "../content/site";

export function assertLocale(value: string): Locale {
  if ((locales as readonly string[]).includes(value)) {
    return value as Locale;
  }
  notFound();
}

