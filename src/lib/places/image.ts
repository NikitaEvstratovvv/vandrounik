/** Build a Wikimedia Commons thumbnail URL from a File: name or bare filename. */
export function commonsFileUrl(fileName: string, width = 640): string | undefined {
  const cleaned = fileName
    .trim()
    .replace(/^File:/i, '')
    .replace(/^Файл:/i, '')
  if (!cleaned) return undefined
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(cleaned)}?width=${width}`
}

/** Prefer direct Commons / upload URLs from OSM image tags; skip Google Photos etc. */
export function imageUrlFromOsmTags(
  tags: Record<string, string | undefined> | null | undefined,
): string | undefined {
  if (!tags) return undefined

  const commons = tags.wikimedia_commons?.trim()
  if (commons && /^(File:|Файл:)/i.test(commons)) {
    return commonsFileUrl(commons)
  }

  const image = tags.image?.trim()
  if (!image) return undefined

  if (/^(File:|Файл:)/i.test(image)) return commonsFileUrl(image)
  if (/^https?:\/\/upload\.wikimedia\.org\//i.test(image)) return image
  if (/^https?:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//i.test(image)) return image

  return undefined
}
