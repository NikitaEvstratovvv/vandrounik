/**
 * Выгрузка POI Беларуси из OpenStreetMap через Overpass API.
 * Категории: замки, усадьбы, храмы, заповедники, ДОТы.
 *
 * Запуск: npm run import:osm-belarus
 *
 * Лицензия данных: ODbL (OpenStreetMap). При показе данных в приложении
 * обязательно указывать «© OpenStreetMap».
 */

import { readFileSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const TYPE_REGISTRY = JSON.parse(
  readFileSync(join(ROOT, 'src', 'data', 'place-taxonomy.json'), 'utf8'),
).types

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const POI_FILTERS = `
  nwr["historic"="castle"](area.a);
  nwr["castle_type"](area.a);
  nwr["historic"="manor"](area.a);
  nwr["building"~"cathedral|church|chapel|monastery"](area.a);
  nwr["amenity"="place_of_worship"](area.a);
  nwr["boundary"="national_park"](area.a);
  nwr["leisure"="nature_reserve"](area.a);
  nwr["boundary"="protected_area"]["protect_class"~"^[1-6]$"](area.a);
  nwr["historic"="bunker"](area.a);
  nwr["military"="bunker"](area.a);
  nwr["man_made"="bunker"](area.a);
  nwr["building"="bunker"](area.a);
`.trim()

const COUNTRY_QUERY = `
[out:json][timeout:300];
area["ISO3166-1"="BY"]["admin_level"="2"]->.a;
(
${POI_FILTERS}
);
out center tags;
`.trim()

const REGION_QUERIES = [
  { label: 'Брестская область', area: 'area["name:ru"="Брестская область"]["admin_level"="4"]->.a;' },
  { label: 'Витебская область', area: 'area["name:ru"="Витебская область"]["admin_level"="4"]->.a;' },
  { label: 'Гомельская область', area: 'area["name:ru"="Гомельская область"]["admin_level"="4"]->.a;' },
  { label: 'Гродненская область', area: 'area["name:ru"="Гродненская область"]["admin_level"="4"]->.a;' },
  { label: 'Минская область', area: 'area["name:ru"="Минская область"]["admin_level"="4"]->.a;' },
  { label: 'Могилёвская область', area: 'area["name:ru"="Могилёвская область"]["admin_level"="4"]->.a;' },
  { label: 'г. Минск', area: 'area["name:ru"="Минск"]["admin_level"="6"]->.a;' },
]

// Bbox Беларуси для фильтрации некорректных координат
const BBOX = { minLat: 51.2, maxLat: 56.2, minLng: 23.0, maxLng: 32.9 }

function inBbox(lat, lng) {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lng >= BBOX.minLng && lng <= BBOX.maxLng
}

function getCoords(element) {
  if (element.type === 'node') {
    return { lat: element.lat, lng: element.lon }
  }
  if (element.center) {
    return { lat: element.center.lat, lng: element.center.lon }
  }
  return null
}

function getName(tags) {
  return (tags['name:ru'] || tags['name:be'] || tags.name || '').trim()
}

function withTaxonomy(type) {
  const meta = TYPE_REGISTRY[type]
  if (!meta) return null
  return {
    type,
    interests: [meta.interest],
    typeGroup: meta.typeGroup,
    typeGroupLabel: meta.typeGroupLabel,
  }
}

function getTypeAndInterests(tags) {
  const historic = tags.historic ?? ''
  const building = tags.building ?? ''
  const amenity = tags.amenity ?? ''
  const boundary = tags.boundary ?? ''
  const leisure = tags.leisure ?? ''
  const castleType = tags.castle_type ?? ''
  const military = tags.military ?? ''
  const manMade = tags.man_made ?? ''

  if (historic === 'bunker' || military === 'bunker' || manMade === 'bunker' || building === 'bunker') {
    return withTaxonomy('ДОТ')
  }
  if (boundary === 'national_park') {
    return withTaxonomy('Нац. парк')
  }
  if (leisure === 'nature_reserve' || boundary === 'protected_area') {
    return withTaxonomy('Заповедник')
  }
  if (historic === 'castle' || castleType) {
    return withTaxonomy('Замок')
  }
  if (historic === 'manor') {
    return withTaxonomy('Усадьба')
  }
  if (
    building === 'cathedral' ||
    building === 'church' ||
    building === 'chapel' ||
    building === 'monastery'
  ) {
    const subType =
      building === 'cathedral' ? 'Собор'
      : building === 'monastery' ? 'Монастырь'
      : 'Храм'
    return withTaxonomy(subType)
  }
  if (amenity === 'place_of_worship') {
    const religion = tags.religion ?? ''
    const subType = religion === 'jewish' ? 'Синагога' : religion === 'muslim' ? 'Мечеть' : 'Храм'
    return withTaxonomy(subType)
  }
  return null
}

function resolveName(tags, coords, mapped) {
  const direct = getName(tags)
  if (direct) return direct
  if (mapped.type === 'ДОТ') {
    const ref = (tags.ref || tags['ref:BY'] || '').trim()
    if (ref) return `ДОТ ${ref}`
    return `ДОТ (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`
  }
  return ''
}

function buildDescription(name, type, city) {
  const locationPart = city ? `, ${city}` : ', Беларусь'
  return `${type} «${name}»${locationPart}.`
}

function wikipediaArticleUrl(lang, title) {
  const cleaned = String(title || '').trim()
  if (!cleaned) return undefined
  const slug = cleaned.replace(/ /g, '_')
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`
}

/** Prefer wikipedia:ru, then wikipedia=lang:Title. No bare wikidata. */
function wikipediaUrlFromOsmTags(tags) {
  if (!tags) return undefined

  const ruTitle = (tags['wikipedia:ru'] || '').trim()
  if (ruTitle) {
    const title =
      ruTitle.includes(':') && /^[a-z-]+:/i.test(ruTitle)
        ? ruTitle.replace(/^[a-z-]+:/i, '')
        : ruTitle
    return wikipediaArticleUrl('ru', title)
  }

  const wiki = (tags.wikipedia || '').trim()
  if (wiki) {
    const match = wiki.match(/^([a-z-]+):(.+)$/i)
    if (match) return wikipediaArticleUrl(match[1], match[2].trim())
  }

  return undefined
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
  if (commons && /^(File:|Файл:)/i.test(commons)) {
    return commonsFileUrl(commons)
  }

  const image = (tags.image || '').trim()
  if (!image) return undefined
  if (/^(File:|Файл:)/i.test(image)) return commonsFileUrl(image)
  if (/^https?:\/\/upload\.wikimedia\.org\//i.test(image)) return image
  if (/^https?:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//i.test(image)) return image
  return undefined
}

function typePrefix(elementType) {
  if (elementType === 'node') return 'n'
  if (elementType === 'way') return 'w'
  return 'r'
}

function buildRegionQuery(region) {
  return `
[out:json][timeout:180];
${region.area}
(
${POI_FILTERS}
);
out center tags;
`.trim()
}

async function fetchOverpass(query, label) {
  console.log(`Overpass: ${label}...`)
  const body = 'data=' + encodeURIComponent(query)
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: '*/*',
      'User-Agent': 'vandrounik-poi-importer/1.0',
    },
  })
  if (!res.ok) {
    throw new Error(`Overpass API (${label}) ответил ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

async function fetchAllElements() {
  try {
    const raw = await fetchOverpass(COUNTRY_QUERY, 'вся Беларусь')
    const count = raw.elements?.length ?? 0
    if (count > 0) {
      console.log(`Страновой запрос: ${count} элементов`)
      return { elements: raw.elements, sources: [{ label: 'Беларусь', count }] }
    }
    console.warn('Страновой запрос вернул 0 элементов, переходим к областям')
  } catch (error) {
    console.warn(`Страновой запрос не удался: ${error.message}`)
    console.warn('Переходим к последовательной выгрузке по областям')
  }

  const elements = []
  const seenElementKeys = new Set()
  const sources = []

  for (const region of REGION_QUERIES) {
    try {
      const raw = await fetchOverpass(buildRegionQuery(region), region.label)
      let added = 0
      for (const el of raw.elements ?? []) {
        const key = `${el.type}-${el.id}`
        if (seenElementKeys.has(key)) continue
        seenElementKeys.add(key)
        elements.push(el)
        added++
      }
      sources.push({ label: region.label, count: added })
      console.log(`  ${region.label}: +${added}`)
    } catch (error) {
      console.warn(`  ${region.label}: пропущено (${error.message})`)
    }
  }

  return { elements, sources }
}

function elementsToPlaces(elements) {
  const seen = new Set()
  const places = []

  for (const el of elements) {
    const tags = el.tags ?? {}
    const coords = getCoords(el)
    if (!coords) continue
    if (!inBbox(coords.lat, coords.lng)) continue

    const mapped = getTypeAndInterests(tags)
    if (!mapped) continue

    const name = resolveName(tags, coords, mapped)
    if (!name) continue

    const id = `osm-${typePrefix(el.type)}-${el.id}`
    if (seen.has(id)) continue
    seen.add(id)

    const city = (tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || '').trim()
    const wikipediaUrl = wikipediaUrlFromOsmTags(tags)
    const imageUrl = imageUrlFromOsmTags(tags)
    const wikidataId = (tags.wikidata || '').trim() || undefined

    places.push({
      id,
      name,
      type: mapped.type,
      typeGroup: mapped.typeGroup,
      typeGroupLabel: mapped.typeGroupLabel,
      lat: coords.lat,
      lng: coords.lng,
      interests: mapped.interests,
      description: buildDescription(name, mapped.type, city || null),
      ...(wikipediaUrl ? { wikipediaUrl } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(wikidataId ? { wikidataId } : {}),
      source: 'osm',
    })
  }

  places.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  return places
}

async function main() {
  const { elements, sources } = await fetchAllElements()
  console.log(`Всего элементов OSM: ${elements.length}`)

  const rawPath = join(__dirname, 'data', 'belarus-osm-raw.json')
  await mkdir(join(__dirname, 'data'), { recursive: true })
  await writeFile(
    rawPath,
    JSON.stringify({ fetchedAt: new Date().toISOString(), sources, elements }, null, 2),
    'utf8',
  )
  console.log(`Сырые данные → ${rawPath}`)

  const places = elementsToPlaces(elements)
  const outPath = join(ROOT, 'src', 'data', 'belarus-osm-places.json')
  await writeFile(outPath, JSON.stringify(places, null, 2) + '\n', 'utf8')

  console.log(`\nРезультат: ${places.length} мест → ${outPath}`)

  const byInterest = {}
  for (const p of places) {
    for (const i of p.interests) {
      byInterest[i] = (byInterest[i] ?? 0) + 1
    }
  }
  for (const [interest, count] of Object.entries(byInterest)) {
    console.log(`  ${interest}: ${count}`)
  }
}

main().catch((err) => {
  console.error('Ошибка:', err.message)
  process.exit(1)
})
