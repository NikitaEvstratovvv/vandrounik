import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNominatimCache } from '@/lib/geocoding/nominatim'
import { searchPlaces } from '@/data/places'

describe('searchPlaces (geo + POI)', () => {
  beforeEach(() => {
    clearNominatimCache()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('puts Mir castle from local catalog ahead of empty Nominatim', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const places = await searchPlaces('Мирский замок')

    expect(places.length).toBeGreaterThan(0)
    expect(places[0]?.title).toMatch(/мирский/i)
    expect(places[0]?.id.startsWith('poi:')).toBe(true)
    expect(places[0]?.subtitle).toMatch(/замок/i)
  })

  it('still returns Nominatim cities when no POI match', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(
        JSON.stringify([
          {
            place_id: 1,
            osm_type: 'relation',
            osm_id: 59195,
            lat: '53.9023',
            lon: '27.5615',
            name: 'Минск',
            display_name: 'Минск, Минская область, Беларусь',
            category: 'boundary',
            type: 'administrative',
            addresstype: 'city',
            address: {
              city: 'Минск',
              state: 'Минская область',
              country_code: 'by',
            },
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const places = await searchPlaces('Минск')

    expect(places.some((p) => p.title === 'Минск')).toBe(true)
  })

  it('dedupes Nominatim hit near a matching POI', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(
        JSON.stringify([
          {
            place_id: 888,
            osm_type: 'node',
            osm_id: 888,
            lat: '53.4515',
            lon: '26.4731',
            name: 'Мирский Замок',
            display_name: 'Мирский Замок, Мир',
            category: 'historic',
            type: 'castle',
            address: {
              town: 'Мир',
              state: 'Гродненская область',
              country_code: 'by',
            },
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const places = await searchPlaces('Мирский Замок')
    const mirHits = places.filter((p) => /мирский/i.test(p.title))
    expect(mirHits.length).toBe(1)
    expect(mirHits[0]?.id.startsWith('poi:')).toBe(true)
  })
})
