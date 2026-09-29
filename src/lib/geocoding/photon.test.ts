import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPhotonCache,
  mapPhotonFeatures,
  queryVariants,
  searchPlaces,
} from '@/lib/geocoding/photon'

describe('queryVariants', () => {
  it('adds Belarusian і ↔ Russian и forms', () => {
    expect(queryVariants('мин')).toEqual(expect.arrayContaining(['мин', 'мін']))
    expect(queryVariants('мін')).toEqual(expect.arrayContaining(['мін', 'мин']))
  })

  it('keeps queries without и/і unchanged', () => {
    expect(queryVariants('грод')).toEqual(['грод'])
  })
})

describe('mapPhotonFeatures', () => {
  it('labels waterways as Река with location', () => {
    const places = mapPhotonFeatures([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [23.8, 53.7] },
        properties: {
          osm_id: 77,
          osm_type: 'W',
          osm_key: 'waterway',
          osm_value: 'river',
          name: 'Нёман',
          state: 'Гродзенская вобласць',
          countrycode: 'BY',
        },
      },
    ])

    expect(places[0]).toMatchObject({
      title: 'Нёман',
      subtitle: 'Река · Гродненская область',
    })
  })

  it('maps a Belarus city with Russian labels', () => {
    const places = mapPhotonFeatures(
      [
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
      'мин',
    )

    expect(places).toEqual([
      {
        id: 'osm:R:59195',
        title: 'Минск',
        subtitle: 'Город · Минская область',
        lat: 53.9023,
        lng: 27.5615,
      },
    ])
  })

  it('maps a Belarusian street name into Russian', () => {
    const places = mapPhotonFeatures([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [23.804, 53.657] },
        properties: {
          osm_id: 138945584,
          osm_type: 'W',
          osm_key: 'highway',
          osm_value: 'primary',
          name: 'вуліца Суворава',
          city: 'Гродна',
          state: 'Гродзенская вобласць',
          countrycode: 'BY',
        },
      },
    ])

    expect(places[0]).toMatchObject({
      title: 'улица Суворова',
      subtitle: 'Улица · Гродно, Гродненская область',
    })
  })

  it('maps a street with housenumber', () => {
    const places = mapPhotonFeatures([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [23.8313, 53.6884] },
        properties: {
          osm_id: 123,
          osm_type: 'W',
          osm_key: 'highway',
          osm_value: 'residential',
          name: 'улица Суворова',
          street: 'улица Суворова',
          housenumber: '13',
          city: 'Гродно',
          state: 'Гродненская область',
          countrycode: 'by',
        },
      },
    ])

    expect(places[0]).toMatchObject({
      id: 'osm:W:123',
      title: 'улица Суворова',
      subtitle: 'Улица · Гродно, Гродненская область',
      lat: 53.6884,
      lng: 23.8313,
    })
  })

  it('maps a building address (Photon housenumber hit)', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.8313, 53.6884] },
          properties: {
            osm_id: 456,
            osm_type: 'W',
            osm_key: 'building',
            osm_value: 'apartments',
            street: 'вуліца Суворава',
            housenumber: '13',
            city: 'Гродна',
            state: 'Гродзенская вобласць',
            countrycode: 'BY',
          },
        },
      ],
      'Суворова 13',
    )

    expect(places[0]).toMatchObject({
      id: 'osm:W:456',
      title: 'улица Суворова, 13',
      subtitle: 'Гродно, Гродненская область',
      lat: 53.6884,
      lng: 23.8313,
    })
  })

  it('drops buildings without a street address', () => {
    const places = mapPhotonFeatures([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [23.8, 53.6] },
        properties: {
          osm_id: 789,
          osm_type: 'W',
          osm_key: 'building',
          osm_value: 'yes',
          name: 'Склад',
          city: 'Гродно',
          countrycode: 'BY',
        },
      },
    ])

    expect(places).toHaveLength(0)
  })

  it('drops non-Belarus and non-place/highway results', () => {
    const places = mapPhotonFeatures([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [37.6173, 55.7558] },
        properties: {
          osm_id: 1,
          osm_type: 'R',
          osm_key: 'place',
          osm_value: 'city',
          name: 'Москва',
          countrycode: 'RU',
        },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [27.56, 53.9] },
        properties: {
          osm_id: 99,
          osm_type: 'N',
          osm_key: 'shop',
          osm_value: 'convenience',
          name: 'МиниМАГ',
          countrycode: 'BY',
        },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [27.5615, 53.9023] },
        properties: {
          osm_id: 2,
          osm_type: 'R',
          osm_key: 'place',
          osm_value: 'city',
          name: 'Мінск',
          countrycode: 'BY',
        },
      },
    ])

    expect(places).toHaveLength(1)
    expect(places[0].title).toBe('Минск')
  })

  it('builds title from street when name is missing', () => {
    const places = mapPhotonFeatures([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [27.5, 53.9] },
        properties: {
          osm_id: 9,
          osm_type: 'W',
          osm_key: 'place',
          osm_value: 'house',
          street: 'проспект Независимости',
          housenumber: '10',
          city: 'Минск',
          countrycode: 'BY',
        },
      },
    ])

    expect(places[0].title).toBe('проспект Независимости, 10')
    expect(places[0].subtitle).toBe('Минск')
  })

  it('drops fuzzy Photon hits when a prefix match exists', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [24.0, 53.7] },
          properties: {
            osm_id: 1,
            osm_type: 'N',
            osm_key: 'place',
            osm_value: 'hamlet',
            name: 'Лапенки',
            city: 'Hrodna',
            state: 'Hrodna region',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [24.1, 53.8] },
          properties: {
            osm_id: 2,
            osm_type: 'N',
            osm_key: 'place',
            osm_value: 'hamlet',
            name: 'Лабейки',
            city: 'Shumilina',
            state: 'Vitsebsk region',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [24.2, 53.9] },
          properties: {
            osm_id: 3,
            osm_type: 'N',
            osm_key: 'place',
            osm_value: 'hamlet',
            name: 'Лапейки',
            city: 'Ashmyany',
            state: 'Hrodna region',
            countrycode: 'BY',
          },
        },
      ],
      'Лапенки',
    )

    expect(places).toHaveLength(1)
    expect(places[0]?.title).toBe('Лапенки')
  })

  it('keeps fuzzy hits when nothing matches by prefix', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [24.1, 53.8] },
          properties: {
            osm_id: 2,
            osm_type: 'N',
            osm_key: 'place',
            osm_value: 'hamlet',
            name: 'Лабейки',
            countrycode: 'BY',
          },
        },
      ],
      'Лапенки',
    )

    expect(places).toHaveLength(1)
    expect(places[0]?.title).toBe('Лабейки')
  })

  it('maps Brest fortress heroes street from Russian query', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.656, 52.092] },
          properties: {
            osm_id: 3001,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'secondary',
            name: 'вуліца Герояў Абароны Брэсцкай Крэпасці',
            city: 'Брэст',
            state: 'Брэсцкая вобласць',
            countrycode: 'BY',
          },
        },
      ],
      'ул. Героев обороны Брестской крепости, 60',
    )

    expect(places[0]).toMatchObject({
      title: 'улица Героев обороны Брестской крепости',
      subtitle: 'Улица · Брест, Брестская область',
    })
  })

  it('maps Dzerzhinskogo via Дзяржынскага variant', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [27.56, 53.9] },
          properties: {
            osm_id: 2001,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'primary',
            name: 'праспект Дзяржынскага',
            city: 'Мінск',
            countrycode: 'BY',
          },
        },
      ],
      'Дзержинского',
    )

    expect(places[0]).toMatchObject({
      title: 'проспект Дзержинского',
      subtitle: 'Улица · Минск',
    })
  })

  it('maps Vrublevskogo 66 via Урублеўскага variant', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.82, 53.69] },
          properties: {
            osm_id: 1001,
            osm_type: 'W',
            osm_key: 'building',
            osm_value: 'apartments',
            street: 'вуліца Урублеўскага',
            housenumber: '66',
            city: 'Гродна',
            state: 'Гродзенская вобласць',
            countrycode: 'BY',
          },
        },
      ],
      'Врублевского 66',
    )

    expect(places[0]).toMatchObject({
      title: 'улица Врублевского, 66',
      subtitle: 'Гродно, Гродненская область',
    })
  })

  it('matches street addresses when query includes housenumber', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.8313, 53.6884] },
          properties: {
            osm_id: 456,
            osm_type: 'W',
            osm_key: 'building',
            osm_value: 'apartments',
            street: 'вуліца Суворава',
            housenumber: '13',
            city: 'Гродна',
            state: 'Гродзенская вобласць',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.9, 53.7] },
          properties: {
            osm_id: 999,
            osm_type: 'N',
            osm_key: 'place',
            osm_value: 'hamlet',
            name: 'Суворовка',
            countrycode: 'BY',
          },
        },
      ],
      'Суворова 13',
    )

    expect(places).toHaveLength(1)
    expect(places[0]?.title).toBe('улица Суворова, 13')
  })

  it('collapses duplicate street segments with the same label', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [27.5, 53.9] },
          properties: {
            osm_id: 100,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'primary',
            name: 'праспект Дзяржынскага',
            city: 'Мінск',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [27.52, 53.91] },
          properties: {
            osm_id: 101,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'primary',
            name: 'праспект Дзяржынскага',
            city: 'Мінск',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [27.54, 53.92] },
          properties: {
            osm_id: 102,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'secondary',
            name: 'праспект Дзяржынскага',
            city: 'Мінск',
            countrycode: 'BY',
          },
        },
      ],
      'Дзержинского',
    )

    expect(places).toHaveLength(1)
    expect(places[0]?.title).toBe('проспект Дзержинского')
  })

  it('keeps same street name in different cities', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [27.5, 53.9] },
          properties: {
            osm_id: 1,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'residential',
            name: 'улица Суворова',
            city: 'Минск',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.8, 53.7] },
          properties: {
            osm_id: 2,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'residential',
            name: 'улица Суворова',
            city: 'Гродно',
            countrycode: 'BY',
          },
        },
      ],
      'Суворова',
    )

    expect(places).toHaveLength(2)
  })

  it('ranks cities above streets', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [27.5, 53.9] },
          properties: {
            osm_id: 1,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'residential',
            name: 'Минская улица',
            city: 'Минск',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [27.5615, 53.9023] },
          properties: {
            osm_id: 2,
            osm_type: 'R',
            osm_key: 'place',
            osm_value: 'city',
            name: 'Мінск',
            countrycode: 'BY',
          },
        },
      ],
      'мин',
    )

    expect(places[0].title).toBe('Минск')
  })

  it('ranks exact city match first for a city query', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.8, 53.7] },
          properties: {
            osm_id: 1,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'residential',
            name: 'Гродненская улица',
            city: 'Гродно',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.83, 53.68] },
          properties: {
            osm_id: 2,
            osm_type: 'R',
            osm_key: 'place',
            osm_value: 'city',
            name: 'Гродна',
            state: 'Гродзенская вобласць',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [23.84, 53.69] },
          properties: {
            osm_id: 3,
            osm_type: 'W',
            osm_key: 'highway',
            osm_value: 'residential',
            name: 'Гродно',
            city: 'Минск',
            countrycode: 'BY',
          },
        },
      ],
      'Гродно',
    )

    expect(places[0]?.title).toBe('Гродно')
    expect(places[0]?.id).toBe('osm:R:2')
  })

  it('ranks villages above highways for settlement queries', () => {
    const places = mapPhotonFeatures(
      [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [24.0, 53.7] },
          properties: {
            osm_id: 1,
            osm_type: 'N',
            osm_key: 'highway',
            osm_value: 'bus_stop',
            name: 'Лапенки',
            city: 'Гродно',
            countrycode: 'BY',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [24.01, 53.71] },
          properties: {
            osm_id: 2,
            osm_type: 'N',
            osm_key: 'place',
            osm_value: 'hamlet',
            name: 'Лапенки',
            state: 'Гродзенская вобласць',
            countrycode: 'BY',
          },
        },
      ],
      'Лапенки',
    )

    expect(places[0]?.title).toBe('Лапенки')
    expect(places[0]?.id).toBe('osm:N:2')
  })
})

describe('searchPlaces', () => {
  beforeEach(() => {
    clearPhotonCache()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not fetch for queries shorter than 3 characters', async () => {
    await expect(searchPlaces('ми')).resolves.toEqual([])
    await expect(searchPlaces('')).resolves.toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches Photon for и and і variants and maps Минск for «мин»', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      const isBe = url.includes(encodeURIComponent('мін'))
      const features = isBe
        ? [
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
          ]
        : [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [31.3, 55.8] },
              properties: {
                osm_id: 1,
                osm_type: 'N',
                osm_key: 'place',
                osm_value: 'hamlet',
                name: 'Миняково',
                countrycode: 'RU',
              },
            },
          ]
      return new Response(JSON.stringify({ features }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const places = await searchPlaces('мин')

    expect(fetch).toHaveBeenCalledTimes(2)
    const urls = vi.mocked(fetch).mock.calls.map((call) => String(call[0]))
    expect(urls.some((url) => url.includes('/api/photon?'))).toBe(true)
    expect(urls.some((url) => url.includes('bbox='))).toBe(true)
    expect(urls.every((url) => !url.includes('lang='))).toBe(true)
    expect(places[0]?.title).toBe('Минск')
    expect(places[0]?.subtitle).toBe('Город · Минская область')
  })

  it('expands Суворова to Суворава variants', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(JSON.stringify({ features: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await searchPlaces('Суворова')

    const urls = vi.mocked(fetch).mock.calls.map((call) => String(call[0]))
    expect(urls.some((url) => url.includes(encodeURIComponent('Суворова')))).toBe(true)
    expect(urls.some((url) => url.includes(encodeURIComponent('Суворава')))).toBe(true)
  })

  it('passes near bias as lat/lon', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      new Response(JSON.stringify({ features: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await searchPlaces('грод', { near: { lat: 53.67, lng: 23.81 } })

    expect(fetch).toHaveBeenCalledTimes(1)
    const url = String(vi.mocked(fetch).mock.calls[0][0])
    expect(url).toContain('lat=53.67')
    expect(url).toContain('lon=23.81')
  })
})
