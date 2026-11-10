"use client";

import { useEffect } from "react";
import type { Locale } from "../content/site";

export function HtmlLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

