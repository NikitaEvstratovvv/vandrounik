import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPhotonCache } from '@/lib/geocoding/photon'
import { searchPlaces } from '@/data/places'

describe('searchPlaces (geo + POI)', () => {
  beforeEach(() => {
    clearPhotonCache()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('puts Mir castle from local catalog ahead of empty Photon', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(JSON.stringify({ features: [] }), {
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

  it('still returns Photon cities when no POI match', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(
        JSON.stringify({
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [27.5615, 53.9023] },
              properties: {
                osm_id: 59195,
                osm_type: 'R',
                osm_key: 'place',
                osm_value: 'city',
                name: 'Мінск',
                state: 'Мінская вобласць',
                countrycode: 'BY',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const places = await searchPlaces('Мінск')

    expect(places.some((p) => p.title === 'Минск')).toBe(true)
  })

  it('dedupes Photon hit near a matching POI', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(
        JSON.stringify({
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [26.4731, 53.4515] },
              properties: {
                osm_id: 888,
                osm_type: 'N',
                osm_key: 'place',
                osm_value: 'locality',
                name: 'Мирский Замок',
                countrycode: 'BY',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const places = await searchPlaces('Мирский Замок')
    const mirHits = places.filter((p) => /мирский/i.test(p.title))
    expect(mirHits.length).toBe(1)
    expect(mirHits[0]?.id.startsWith('poi:')).toBe(true)
  })
})
