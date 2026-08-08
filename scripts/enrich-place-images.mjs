/**
 * Enrich belarus-osm-places.json with imageUrl from OSM tags, Wikidata P18, or Wikipedia summary.
 * Uses existing raw Overpass dump — no Overpass re-fetch.
 *
 * Запуск: npm run enrich:place-images
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const UA = 'VandrounikPOI/1.0 (place image enricher; local educational project)'
const BATCH = 40
const WIKI_CONCURRENCY = 4

function typePrefix(elementType) {
  if (elementType === 'node') return 'n'
  if (elementType === 'way') return 'w'
  return 'r'
}

function commonsFileUrl(fileName, width = 640) {
  const cleaned = String(fileName || '')
    .trim()
    .replace(/^File:/i, '')
    .replace(/^Файл:/i, '')
  if (!cleaned) return undefined
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(cleaned)}?width=${width}`
}

function imageUrlFromOsmTags(tags) {
  if (!tags) return undefined
  const commons = (tags.wikimedia_commons || '').trim()
  if (commons && /^(File:|Файл:)/i.test(commons)) return commonsFileUrl(commons)
  const image = (tags.image || '').trim()
  if (!image) return undefined
  if (/^(File:|Файл:)/i.test(image)) return commonsFileUrl(image)
  if (/^https?:\/\/upload\.wikimedia\.org\//i.test(image)) return image
  if (/^https?:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//i.test(image)) return image
  return undefined
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': UA,
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function fetchWikidataImages(ids) {
  const map = new Map()
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH)
    const url =
      'https://www.wikidata.org/w/api.php?' +
      new URLSearchParams({
        action: 'wbgetentities',
        ids: chunk.join('|'),
        props: 'claims',
        format: 'json',
        origin: '*',
      })
    try {
      const data = await fetchJson(url)
      for (const id of chunk) {
        const entity = data.entities?.[id]
        const claim = entity?.claims?.P18?.[0]
        const fileName = claim?.mainsnak?.datavalue?.value
        const imageUrl = fileName ? commonsFileUrl(fileName) : undefined
        if (imageUrl) map.set(id, imageUrl)
      }
      console.log(`Wikidata: ${Math.min(i + BATCH, ids.length)}/${ids.length}`)
    } catch (error) {
      console.warn(`Wikidata batch failed: ${error.message}`)
      await sleep(2500)
      try {
        const data = await fetchJson(url)
        for (const id of chunk) {
          const entity = data.entities?.[id]
          const claim = entity?.claims?.P18?.[0]
          const fileName = claim?.mainsnak?.datavalue?.value
          const imageUrl = fileName ? commonsFileUrl(fileName) : undefined
          if (imageUrl) map.set(id, imageUrl)
        }
        console.log(`Wikidata retry OK: ${Math.min(i + BATCH, ids.length)}/${ids.length}`)
      } catch (retryError) {
        console.warn(`Wikidata retry failed: ${retryError.message}`)
      }
    }
    await sleep(500)
  }
  return map
}

function parseWikipediaUrl(url) {
  try {
    const u = new URL(url)
    const hostMatch = u.hostname.match(/^([a-z-]+)\.wikipedia\.org$/i)
    if (!hostMatch) return null
    const lang = hostMatch[1]
    const parts = u.pathname.split('/')
    const wikiIdx = parts.indexOf('wiki')
    if (wikiIdx < 0 || !parts[wikiIdx + 1]) return null
    const title = decodeURIComponent(parts.slice(wikiIdx + 1).join('/'))
    return { lang, title }
  } catch {
    return null
  }
}

async function fetchWikipediaThumbnail(wikipediaUrl) {
  const parsed = parseWikipediaUrl(wikipediaUrl)
  if (!parsed) return undefined
  const url =
    `https://${parsed.lang}.wikipedia.org/api/rest_v1/page/summary/` +
    encodeURIComponent(parsed.title.replace(/ /g, '_'))
  try {
    const data = await fetchJson(url)
    return data.originalimage?.source || data.thumbnail?.source || undefined
  } catch {
    return undefined
  }
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

async function main() {
  const rawPath = join(__dirname, 'data', 'belarus-osm-raw.json')
  const placesPath = join(ROOT, 'src', 'data', 'belarus-osm-places.json')
  const raw = JSON.parse(readFileSync(rawPath, 'utf8'))
  const places = JSON.parse(readFileSync(placesPath, 'utf8'))

  const osmById = new Map()
  for (const el of raw.elements || []) {
    const id = `osm-${typePrefix(el.type)}-${el.id}`
    osmById.set(id, el.tags || {})
  }

  let fromOsm = 0
  const needWikidata = []
  const needWikipedia = []

  for (const place of places) {
    const tags = osmById.get(place.id) || {}
    const direct = imageUrlFromOsmTags(tags)
    if (direct) {
      place.imageUrl = direct
      fromOsm++
      continue
    }

    const wikidataId = (tags.wikidata || place.wikidataId || '').trim()
    if (wikidataId) {
      needWikidata.push({ place, wikidataId })
      continue
    }

    if (place.wikipediaUrl) {
      needWikipedia.push(place)
    } else {
      delete place.imageUrl
    }
  }

  const uniqueQ = [...new Set(needWikidata.map((x) => x.wikidataId))]
  console.log(`OSM direct images: ${fromOsm}`)
  console.log(`Wikidata lookups: ${uniqueQ.length}`)
  const wdImages = await fetchWikidataImages(uniqueQ)

  let fromWd = 0
  for (const { place, wikidataId } of needWikidata) {
    const imageUrl = wdImages.get(wikidataId)
    if (imageUrl) {
      place.imageUrl = imageUrl
      fromWd++
    } else if (place.wikipediaUrl) {
      needWikipedia.push(place)
    } else {
      delete place.imageUrl
    }
  }

  // Dedupe wikipedia queue by place id
  const wikiQueue = []
  const seen = new Set()
  for (const place of needWikipedia) {
    if (place.imageUrl || seen.has(place.id) || !place.wikipediaUrl) continue
    seen.add(place.id)
    wikiQueue.push(place)
  }

  console.log(`Wikipedia summary lookups: ${wikiQueue.length}`)
  let fromWiki = 0
  await mapPool(wikiQueue, WIKI_CONCURRENCY, async (place, index) => {
    const imageUrl = await fetchWikipediaThumbnail(place.wikipediaUrl)
    if (imageUrl) {
      place.imageUrl = imageUrl
      fromWiki++
    } else {
      delete place.imageUrl
    }
    if ((index + 1) % 25 === 0 || index + 1 === wikiQueue.length) {
      console.log(`Wikipedia: ${index + 1}/${wikiQueue.length}`)
    }
    await sleep(50)
  })

  const withImage = places.filter((p) => p.imageUrl).length
  writeFileSync(placesPath, JSON.stringify(places, null, 2) + '\n')
  console.log(`\nDone: ${withImage}/${places.length} places have imageUrl`)
  console.log(`  OSM: ${fromOsm}, Wikidata: ${fromWd}, Wikipedia: ${fromWiki}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
