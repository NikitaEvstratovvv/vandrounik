/**
 * Belarusian ↔ Russian helpers for Photon search/display.
 * OSM BY often stores Belarusian names; users type Russian.
 */

/** ru ↔ be pairs applied as whole-word / phrase swaps in queries. */
const STREET_TYPE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['улица', 'вуліца'],
  ['переулок', 'завулак'],
  ['проспект', 'праспект'],
  ['площадь', 'плошча'],
  ['шоссе', 'шаша'],
]

const PLACE_NAME_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['гродно', 'гродна'],
  ['минск', 'мінск'],
  ['брест', 'брэст'],
  ['витебск', 'віцебск'],
  ['могилёв', 'магілёў'],
  ['могилев', 'магілёў'],
  ['борисов', 'барысаў'],
]

/** Longest-first ru ↔ be swaps inside street names (queries). */
const STREET_WORD_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['героев обороны брестской крепости', 'Герояў Абароны Брэсцкай Крэпасці'],
  ['брестской крепости', 'Брэсцкай Крэпасці'],
  ['героев', 'Герояў'],
  ['обороны', 'Абароны'],
  ['брестской', 'Брэсцкай'],
  ['крепости', 'Крэпасці'],
  ['крепость', 'Крэпасць'],
]

/** Longest-first phrases for be → ru display. */
const DISPLAY_PHRASES: ReadonlyArray<readonly [string, string]> = [
  ['Герояў Абароны Брэсцкай Крэпасці', 'Героев обороны Брестской крепости'],
  ['герояў абароны брэсцкай крэпасці', 'Героев обороны Брестской крепости'],
  ['Мінская вобласць', 'Минская область'],
  ['Гродзенская вобласць', 'Гродненская область'],
  ['Брэсцкая вобласць', 'Брестская область'],
  ['Віцебская вобласць', 'Витебская область'],
  ['Магілёўская вобласць', 'Могилёвская область'],
  ['Гомельская вобласць', 'Гомельская область'],
  ['Minsk region', 'Минская область'],
  ['Hrodna region', 'Гродненская область'],
  ['Brest region', 'Брестская область'],
  ['Vitsebsk region', 'Витебская область'],
  ['Mahilyow region', 'Могилёвская область'],
  ['Homel region', 'Гомельская область'],
  ['гарадскі пасёлак', 'городской посёлок'],
  ['сельскі Савет', 'сельсовет'],
  ['сельскі савет', 'сельсовет'],
  ['Мінск-Пасажырскі', 'Минск-Пассажирский'],
  ['Брэст-Цэнтральны', 'Брест-Центральный'],
  ['Брэст-Паўднёвы', 'Брест-Южный'],
  ['Кастрычніцкі раён', 'Октябрьский район'],
  ['Цэнтральны раён', 'Центральный район'],
  ['Маскоўскі раён', 'Московский район'],
  ['Чыгуначны раён', 'Железнодорожный район'],
]

const DISPLAY_WORDS: ReadonlyArray<readonly [string, string]> = [
  ['вуліца', 'улица'],
  ['Вуліца', 'Улица'],
  ['завулак', 'переулок'],
  ['Завулак', 'Переулок'],
  ['праспект', 'проспект'],
  ['Праспект', 'Проспект'],
  ['плошча', 'площадь'],
  ['Плошча', 'Площадь'],
  ['шаша', 'шоссе'],
  ['кальцо', 'кольцо'],
  ['вобласць', 'область'],
  ['раён', 'район'],
  ['пасёлак', 'посёлок'],
  ['вёска', 'деревня'],
  ['Мінск', 'Минск'],
  ['Гродна', 'Гродно'],
  ['Hrodna', 'Гродно'],
  ['Брэст', 'Брест'],
  ['Віцебск', 'Витебск'],
  ['Viciebsk', 'Витебск'],
  ['Магілёў', 'Могилёв'],
  ['Mahilyow', 'Могилёв'],
  ['Барысаў', 'Борисов'],
  ['Barysaw', 'Борисов'],
  ['Гомель', 'Гомель'],
  ['Homiel', 'Гомель'],
  ['Паўднёвы', 'Южный'],
  ['Паўночны', 'Северный'],
  ['Цэнтральны', 'Центральный'],
  ['Кастрычніцкі', 'Октябрьский'],
  ['Маскоўскі', 'Московский'],
  ['Чыгуначны', 'Железнодорожный'],
]

const MAX_QUERY_VARIANTS = 6

function swapCharCaseAware(text: string, from: string, to: string): string {
  return text.replaceAll(new RegExp(from, 'gi'), (ch) =>
    ch === ch.toUpperCase() ? to.toUpperCase() : to.toLowerCase(),
  )
}

function addИІVariants(text: string, into: Set<string>): void {
  if (!/[иіИІ]/.test(text)) return
  into.add(swapCharCaseAware(text, 'и', 'і'))
  into.add(swapCharCaseAware(text, 'і', 'и'))
}

/** Суворова ↔ Суворава (token-ending). */
function addОваАваVariants(text: string, into: Set<string>): void {
  const tokenEnd = '(?=[^\\p{L}]|$)'
  if (new RegExp(`ова${tokenEnd}`, 'iu').test(text)) {
    into.add(text.replace(new RegExp(`ова${tokenEnd}`, 'giu'), (m) => (m[0] === 'О' ? 'Ава' : 'ава')))
  }
  if (new RegExp(`ава${tokenEnd}`, 'iu').test(text)) {
    into.add(text.replace(new RegExp(`ава${tokenEnd}`, 'giu'), (m) => (m[0] === 'А' ? 'Ова' : 'ова')))
  }
  if (new RegExp(`овская${tokenEnd}`, 'iu').test(text)) {
    into.add(
      text.replace(new RegExp(`овская${tokenEnd}`, 'giu'), (m) => (m[0] === 'О' ? 'Аўская' : 'аўская')),
    )
  }
  if (new RegExp(`аўская${tokenEnd}`, 'iu').test(text)) {
    into.add(
      text.replace(new RegExp(`аўская${tokenEnd}`, 'giu'), (m) => (m[0] === 'А' ? 'Овская' : 'овская')),
    )
  }
}

/** Genitive street adjectives: -ского/-скага, лев/леў, вруб/уруб, ержин/яржын, ин/ын. */
function addGenitiveAdjectiveVariants(text: string, into: Set<string>): void {
  const tokenEnd = '(?=[^\\p{L}]|$)'
  if (new RegExp(`ского${tokenEnd}`, 'iu').test(text)) {
    into.add(text.replace(new RegExp(`ского${tokenEnd}`, 'giu'), (m) => matchCase(m, 'скага')))
  }
  if (new RegExp(`скага${tokenEnd}`, 'iu').test(text)) {
    into.add(text.replace(new RegExp(`скага${tokenEnd}`, 'giu'), (m) => matchCase(m, 'ского')))
  }
  if (/лев(?=ск)/iu.test(text)) {
    into.add(text.replace(/лев(?=ск)/giu, (m) => matchCase(m, 'леў')))
  }
  if (/леў(?=ск)/iu.test(text)) {
    into.add(text.replace(/леў(?=ск)/giu, (m) => matchCase(m, 'лев')))
  }
  if (/вруб/iu.test(text)) {
    into.add(text.replace(/вруб/giu, (m) => matchCase(m, 'уруб')))
  }
  if (/уруб/iu.test(text)) {
    into.add(text.replace(/уруб/giu, (m) => matchCase(m, 'вруб')))
  }
  if (/ержин/iu.test(text)) {
    into.add(text.replace(/ержин/giu, (m) => matchCase(m, 'яржын')))
  }
  if (/яржын/iu.test(text)) {
    into.add(text.replace(/яржын/giu, (m) => matchCase(m, 'ержин')))
  }
  if (/ин(?=ск)/iu.test(text)) {
    into.add(text.replace(/ин(?=ск)/giu, (m) => matchCase(m, 'ын')))
  }
  if (/ын(?=ск)/iu.test(text)) {
    into.add(text.replace(/ын(?=ск)/giu, (m) => matchCase(m, 'ин')))
  }
}

function normalizeSearchQuery(query: string): string {
  return query
    .replace(/\s*,\s*(?=\d)/g, ' ')
    .replace(/(?:^|\s)ул\.\s*/giu, (m) => `${m.startsWith(' ') ? ' ' : ''}улица `)
    .replace(/\s+/g, ' ')
    .trim()
}

function applyStreetWordPairs(text: string): string {
  let out = text
  for (const [ru, be] of STREET_WORD_PAIRS) {
    out = out.replace(new RegExp(escapeRegExp(ru), 'giu'), (m) => matchCase(m, be))
  }
  return out
}

const STREET_TYPE_PREFIX =
  /^(улица|вуліца|проспект|праспект|переулок|завулак|площадь|плошча|шоссе|шаша)\s+/iu

function swapStreetTypesRuToBe(text: string): string {
  let out = text
  for (const [ru, be] of STREET_TYPE_PAIRS) {
    out = out.replace(new RegExp(escapeRegExp(ru), 'giu'), (m) => matchCase(m, be))
  }
  return out
}

/** Full ru→be pass for queries (OSM BY often uses -скага, not -ского). */
function applyBelarusianQueryTransforms(text: string): string {
  return swapStreetTypesRuToBe(
    applyStreetWordPairs(text)
      .replace(/ержин/giu, (m) => matchCase(m, 'яржын'))
      .replace(/ин(?=ск)/giu, (m) => matchCase(m, 'ын'))
      .replace(/вруб/giu, (m) => matchCase(m, 'уруб'))
      .replace(/лев(?=ск)/giu, (m) => matchCase(m, 'леў'))
      .replace(/ского(?=[^\p{L}]|$)/giu, (m) => matchCase(m, 'скага')),
  )
}

function stripStreetTypePrefix(text: string): string {
  return text.replace(STREET_TYPE_PREFIX, '')
}

function addPairVariants(
  text: string,
  pairs: ReadonlyArray<readonly [string, string]>,
  into: Set<string>,
): void {
  const lower = text.toLowerCase()
  for (const [ru, be] of pairs) {
    if (lower.includes(ru)) {
      into.add(text.replace(new RegExp(ru, 'gi'), (m) => matchCase(m, be)))
    }
    if (lower.includes(be.toLowerCase())) {
      into.add(text.replace(new RegExp(be, 'gi'), (m) => matchCase(m, ru)))
    }
  }
}

function matchCase(source: string, target: string): string {
  if (!source) return target
  if (source === source.toUpperCase()) return target.toUpperCase()
  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1)
  }
  return target.toLowerCase()
}

/**
 * Expand a user query into Russian/Belarusian orthography variants for Photon.
 * Caps at {@link MAX_QUERY_VARIANTS} to limit upstream load.
 */
export function expandQuery(query: string): string[] {
  const raw = query.trim()
  if (!raw) return []

  const q = normalizeSearchQuery(raw)
  const variants = new Set<string>([raw])
  if (q !== raw) variants.add(q)

  const wordSwapped = applyStreetWordPairs(q)
  const beGuess = applyBelarusianQueryTransforms(q)
  const beGuessBare = stripStreetTypePrefix(beGuess)
  if (beGuess !== q) variants.add(beGuess)
  if (wordSwapped !== q && beGuessBare !== beGuess) variants.add(beGuessBare)

  const seed = [...variants]
  for (const cur of seed) {
    addИІVariants(cur, variants)
    addОваАваVariants(cur, variants)
    addGenitiveAdjectiveVariants(cur, variants)
    addPairVariants(cur, STREET_WORD_PAIRS, variants)
    addPairVariants(cur, STREET_TYPE_PAIRS, variants)
    addPairVariants(cur, PLACE_NAME_PAIRS, variants)
  }

  // Second pass: combine orthography with street-type swaps (e.g. улица Суворова).
  for (const cur of [...variants]) {
    addИІVariants(cur, variants)
    addОваАваVariants(cur, variants)
    addGenitiveAdjectiveVariants(cur, variants)
    addPairVariants(cur, STREET_WORD_PAIRS, variants)
    addPairVariants(cur, STREET_TYPE_PAIRS, variants)
  }

  const list = [...variants]
  const original = list.filter((v) => v === raw || v === q)
  const prioritized = list.filter(
    (v) =>
      (v === beGuessBare || v === beGuess) && v !== raw && v !== q,
  )
  const rest = list.filter(
    (v) => v !== raw && v !== q && v !== beGuess && v !== beGuessBare,
  )
  return [...original, ...prioritized, ...rest].slice(0, MAX_QUERY_VARIANTS)
}

/** @deprecated alias — use expandQuery */
export const queryVariants = expandQuery

function replacePhrase(text: string, from: string, to: string): string {
  return text.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) =>
    matchCase(m, to),
  )
}

/**
 * After street-type words, Belarusian -ава / -аўская → Russian -ова / -овская
 * (вуліца Суворава → улица Суворова).
 */
function localizeStreetOrthography(text: string): string {
  return text.replace(
    /(улица|переулок|проспект|площадь|шоссе|кольцо)\s+([^\s,]+)/giu,
    (_full, type: string, name: string) => {
      const fixed = name
        .replace(/уруб/giu, (m) => matchCase(m, 'вруб'))
        .replace(/леў(?=ск)/giu, (m) => matchCase(m, 'лев'))
        .replace(/яржын/giu, (m) => matchCase(m, 'ержин'))
        .replace(/ын(?=ск)/giu, (m) => matchCase(m, 'ин'))
        .replace(/скага$/iu, (m) => matchCase(m, 'ского'))
        .replace(/аўская$/iu, (m) => (m[0] === 'А' ? 'Овская' : 'овская'))
        .replace(/аўскі$/iu, (m) => (m[0] === 'А' ? 'Овский' : 'овский'))
        .replace(/ава$/iu, (m) => (m[0] === 'А' ? 'Ова' : 'ова'))
      return `${type} ${fixed}`
    },
  )
}

/**
 * Localize a Photon label for a Russian UI (street types, oblasts, centres, і/ў).
 */
export function localizeLabel(text: string): string {
  if (!text) return text
  let out = text

  for (const [be, ru] of DISPLAY_PHRASES) {
    out = replacePhrase(out, be, ru)
  }
  for (const [be, ru] of DISPLAY_WORDS) {
    out = out.replace(new RegExp(`(^|[^\\p{L}])${escapeRegExp(be)}(?=[^\\p{L}]|$)`, 'gu'), `$1${ru}`)
  }

  // Surname-style adjectives before blanket ў→в (Сувораўская → Суворовская).
  out = out.replace(/аўская/giu, (m) => (m[0] === 'А' ? 'Овская' : 'овская'))
  out = out.replace(/аўскі/giu, (m) => (m[0] === 'А' ? 'Овский' : 'овский'))
  out = out.replace(/уруб/giu, (m) => matchCase(m, 'вруб'))
  out = out.replace(/леў(?=ск)/giu, (m) => matchCase(m, 'лев'))
  out = out.replace(/яржын/giu, (m) => matchCase(m, 'ержин'))
  out = out.replace(/ын(?=ск)/giu, (m) => matchCase(m, 'ин'))
  out = out.replace(/скага(?=[^\p{L}]|$)/giu, (m) => matchCase(m, 'ского'))

  out = localizeStreetOrthography(out)

  out = out.replaceAll('і', 'и').replaceAll('І', 'И')
  out = out.replaceAll('ў', 'в').replaceAll('Ў', 'В')
  return out
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
