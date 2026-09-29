import { describe, expect, it } from 'vitest'
import {
  isStrongPoiMatch,
  searchRoutePlacesLocal,
} from '@/lib/geocoding/routePlacesSearch'

describe('searchRoutePlacesLocal', () => {
  it('finds Mir castle by Russian name', () => {
    const places = searchRoutePlacesLocal('Мирский')
    expect(places.some((p) => /мирский/i.test(p.title))).toBe(true)
    expect(places[0]?.subtitle).toBeTruthy()
    expect(places[0]?.id.startsWith('poi:')).toBe(true)
  })

  it('finds Лидский замок', () => {
    const places = searchRoutePlacesLocal('Лидский замок')
    expect(places[0]?.title).toMatch(/лидский/i)
  })

  it('finds Brest fortress', () => {
    const places = searchRoutePlacesLocal('Брестская крепость')
    expect(places.some((p) => /крепост/i.test(p.title))).toBe(true)
  })

  it('returns empty for short queries', () => {
    expect(searchRoutePlacesLocal('Ми')).toEqual([])
  })

  it('limits result count', () => {
    const places = searchRoutePlacesLocal('церковь')
    expect(places.length).toBeLessThanOrEqual(5)
  })
})

describe('isStrongPoiMatch', () => {
  it('treats prefix title as strong', () => {
    expect(
      isStrongPoiMatch(
        { id: 'poi:x', title: 'Мирский Замок', subtitle: 'Замок', lat: 0, lng: 0 },
        'Мирский',
      ),
    ).toBe(true)
  })
})
