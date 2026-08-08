/** Build a Wikipedia article URL from OSM tags. Prefers ru, then any `wikipedia` lang:title. */
export function wikipediaUrlFromOsmTags(
  tags: Record<string, string | undefined> | null | undefined,
): string | undefined {
  if (!tags) return undefined

  const ruTitle = tags['wikipedia:ru']?.trim()
  if (ruTitle) {
    const title = ruTitle.includes(':') && /^[a-z-]+:/i.test(ruTitle)
      ? ruTitle.replace(/^[a-z-]+:/i, '')
      : ruTitle
    return articleUrl('ru', title)
  }

  const wiki = tags.wikipedia?.trim()
  if (wiki) {
    const match = wiki.match(/^([a-z-]+):(.+)$/i)
    if (match) return articleUrl(match[1], match[2].trim())
  }

  return undefined
}

function articleUrl(lang: string, title: string): string | undefined {
  const cleaned = title.trim()
  if (!cleaned) return undefined
  const slug = cleaned.replace(/ /g, '_')
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`
}
