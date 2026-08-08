import { describe, expect, it } from 'vitest'
import { wikipediaUrlFromOsmTags } from '@/lib/places/wikipedia'

describe('wikipediaUrlFromOsmTags', () => {
  it('prefers wikipedia:ru', () => {
    expect(
      wikipediaUrlFromOsmTags({
        'wikipedia:ru': 'Мирский замок',
        wikipedia: 'be:Мірскі замак',
      }),
    ).toBe('https://ru.wikipedia.org/wiki/%D0%9C%D0%B8%D1%80%D1%81%D0%BA%D0%B8%D0%B9_%D0%B7%D0%B0%D0%BC%D0%BE%D0%BA')
  })

  it('uses wikipedia lang:title', () => {
    expect(wikipediaUrlFromOsmTags({ wikipedia: 'be:Ружанскі палац' })).toBe(
      'https://be.wikipedia.org/wiki/%D0%A0%D1%83%D0%B6%D0%B0%D0%BD%D1%81%D0%BA%D1%96_%D0%BF%D0%B0%D0%BB%D0%B0%D1%86',
    )
  })

  it('ignores wikidata-only', () => {
    expect(wikipediaUrlFromOsmTags({ wikidata: 'Q1591054' })).toBeUndefined()
  })
})
