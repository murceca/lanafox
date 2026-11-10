import type { Metadata } from "next";
import { HomePageContent } from "../../components/HomePageContent";
import { assertLocale } from "../../lib/route-locale";
import { metadataFor } from "../../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return metadataFor(assertLocale(locale), "");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <HomePageContent locale={assertLocale(locale)} />;
}
