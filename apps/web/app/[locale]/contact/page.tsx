import type { Metadata } from "next";
import { ContactForm } from "../../../components/ContactForm";
import { assertLocale } from "../../../lib/route-locale";
import { metadataFor } from "../../../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return metadataFor(assertLocale(locale), "contact");
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ContactForm locale={assertLocale(locale)} />;
}
