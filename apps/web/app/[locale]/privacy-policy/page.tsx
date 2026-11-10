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
  return metadataFor(assertLocale(locale), "privacy-policy");
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PolicyDocument locale={assertLocale(locale)} kind="privacy-policy" />;
}
