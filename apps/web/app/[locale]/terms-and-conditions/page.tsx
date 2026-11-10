import type { Metadata } from "next";
import { PolicyDocument } from "../../../components/PolicyDocument";
import { assertLocale } from "../../../lib/route-locale";
import { metadataFor } from "../../../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return metadataFor(assertLocale(locale), "terms-and-conditions");
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <PolicyDocument locale={assertLocale(locale)} kind="terms-and-conditions" />
  );
}
