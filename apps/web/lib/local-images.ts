import dimensions from "../content/image-dimensions.json";

export type LocalImagePath = keyof typeof dimensions;

export function getImageDimensions(src: LocalImagePath): [number, number] {
  const pair = dimensions[src];
  return [pair[0]!, pair[1]!];
}

export function optimizedImageSrcSet(
  baseName: string,
  widths: readonly number[],
  ext: "avif" | "webp" = "avif",
): string {
  return widths
    .map((w) => `/optimized/${baseName}-${w}.${ext} ${w}w`)
    .join(", ");
}

