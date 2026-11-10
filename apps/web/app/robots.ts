import type { MetadataRoute } from "next";
import { buildRobots } from "../lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}

