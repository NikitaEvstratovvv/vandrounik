import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearNominatimCache,
  mapNominatimResults,
  objectTypeLabel,
  searchPlaces,
} from '@/lib/geocoding/nominatim'

describe('objectTypeLabel', () => {
  it('labels city and street', () => {
    expect(objectTypeLabel({ place_id: 1, lat: '0', lon: '0', display_name: '', type: 'city' })).toBe(
      'Город',
    )
    expect(
      objectTypeLabel({
        place_id: 2,
        lat: '0',
        lon: '0',
        display_name: '',
        category: 'highway',
        type: 'residential',
      }),
    ).toBe('Улица')
  })
})

describe('mapNominatimResults', () => {
  it('maps a Russian city with oblast subtitle', () => {
    const places = mapNominatimResults(
      [
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
            country: 'Беларусь',
            country_code: 'by',
          },
        },
      ],
      'Минск',
    )

    expect(places).toHaveLength(1)
    expect(places[0]?.title).toBe('Минск')
    expect(places[0]?.subtitle).toBe('Город · Минская область')
    expect(places[0]?.id).toBe('osm:relation:59195')
  })

  it('ranks Борисов (boundary + addresstype=city) as a city', () => {
    const places = mapNominatimResults(
      [
        {
          place_id: 172129434,
          osm_type: 'relation',
          osm_id: 1749244,
          lat: '54.224',
          lon: '28.511',
          name: 'Борисов',
          display_name: 'Борисов, Борисовский район, Минская область, Беларусь',
          category: 'boundary',
          type: 'administrative',
          addresstype: 'city',
          address: {
            city: 'Борисов',
            county: 'Борисовский район',
            state: 'Минская область',
            country_code: 'by',
          },
        },
        {
          place_id: 99,
          osm_type: 'way',
          osm_id: 99,
          lat: '53.9',
          lon: '27.5',
          name: 'улица Борисовская',
          display_name: 'улица Борисовская, Минск',
          category: 'highway',
          type: 'residential',
          addresstype: 'road',
          address: {
            road: 'улица Борисовская',
            city: 'Минск',
            state: 'Минская область',
            country_code: 'by',
          },
        },
      ],
      'Борисов',
    )

    expect(places[0]?.title).toBe('Борисов')
    expect(places[0]?.subtitle).toBe('Город · Минская область')
  })

  it('maps a building address from road + house_number', () => {
    const places = mapNominatimResults(
      [
        {
          place_id: 2,
          osm_type: 'way',
          osm_id: 100,
          lat: '53.68',
          lon: '23.83',
          display_name:
            'Многоквартирный дом 15, улица Суворова, Гродно, Гродненская область, Беларусь',
          category: 'building',
          type: 'apartments',
          address: {
            house_number: '15',
            road: 'улица Суворова',
            city: 'Гродно',
            state: 'Гродненская область',
            country_code: 'by',
          },
        },
      ],
      'Суворова 15 Гродно',
    )

    expect(places[0]?.title).toBe('улица Суворова, 15')
    expect(places[0]?.subtitle).toContain('Гродно')
    expect(places[0]?.subtitle).toContain('Гродненская область')
  })

  it('prefers street address over generic building name', () => {
    const places = mapNominatimResults(
      [
        {
          place_id: 3,
          osm_type: 'way',
          osm_id: 101,
          lat: '53.68',
          lon: '23.83',
          name: 'Многоквартирный дом 15',
          display_name: 'Многоквартирный дом 15, улица Суворова, Гродно',
          category: 'building',
          type: 'apartments',
          address: {
            house_number: '15',
            road: 'улица Суворова',
            city: 'Гродно',
            state: 'Гродненская область',
            country_code: 'by',
          },
        },
      ],
      'Суворова 15',
    )

    expect(places[0]?.title).toBe('улица Суворова, 15')
  })

  it('drops shops and amenities', () => {
    const places = mapNominatimResults(
      [
        {
          place_id: 4,
          osm_type: 'node',
          osm_id: 1,
          lat: '53.68',
          lon: '23.83',
          name: 'Ремонт электроники 15',
          display_name: 'Ремонт электроники 15, улица Суворова, Гродно',
          category: 'craft',
          type: 'electronics_repair',
          address: {
            road: 'улица Суворова',
            house_number: '15',
            city: 'Гродно',
            country_code: 'by',
          },
        },
        {
          place_id: 5,
          osm_type: 'node',
          osm_id: 2,
          lat: '53.68',
          lon: '23.83',
          name: 'Кафе',
          display_name: 'Кафе, улица Суворова, Гродно',
          category: 'amenity',
          type: 'cafe',
          address: { city: 'Гродно', country_code: 'by' },
        },
        {
          place_id: 6,
          osm_type: 'way',
          osm_id: 3,
          lat: '53.68',
          lon: '23.83',
          display_name: 'улица Суворова, 15, Гродно',
          category: 'building',
          type: 'apartments',
          address: {
            road: 'улица Суворова',
            house_number: '15',
            city: 'Гродно',
            state: 'Гродненская область',
            country_code: 'by',
          },
        },
      ],
      'Суворова 15',
    )

    expect(places).toHaveLength(1)
    expect(places[0]?.title).toBe('улица Суворова, 15')
  })

  it('ranks cities above streets', () => {
    const places = mapNominatimResults(
      [
        {
          place_id: 10,
          osm_type: 'way',
          osm_id: 10,
          lat: '53.9',
          lon: '27.5',
          name: 'улица Минская',
          display_name: 'улица Минская, Гродно',
          category: 'highway',
          type: 'residential',
          address: {
            road: 'улица Минская',
            city: 'Гродно',
            state: 'Гродненская область',
            country_code: 'by',
          },
        },
        {
          place_id: 11,
          osm_type: 'relation',
          osm_id: 59195,
          lat: '53.9',
          lon: '27.56',
          name: 'Минск',
          display_name: 'Минск, Минская область',
          category: 'place',
          type: 'city',
          address: {
            city: 'Минск',
            state: 'Минская область',
            country_code: 'by',
          },
        },
      ],
      'Минск',
    )

    expect(places[0]?.title).toBe('Минск')
    expect(places[0]?.subtitle).toMatch(/^Город/)
  })

  it('dedupes identical labels', () => {
    const places = mapNominatimResults(
      [
        {
          place_id: 20,
          osm_type: 'way',
          osm_id: 20,
          lat: '53.9',
          lon: '27.5',
          name: 'улица Советская',
          display_name: 'улица Советская, Минск',
          category: 'highway',
          type: 'residential',
          address: {
            road: 'улица Советская',
            city: 'Минск',
            state: 'Минская область',
            country_code: 'by',
          },
        },
        {
          place_id: 21,
          osm_type: 'way',
          osm_id: 21,
          lat: '53.91',
          lon: '27.51',
          name: 'улица Советская',
          display_name: 'улица Советская, Минск',
          category: 'highway',
          type: 'tertiary',
          address: {
            road: 'улица Советская',
            city: 'Минск',
            state: 'Минская область',
            country_code: 'by',
          },
        },
      ],
      'Советская',
    )

    expect(places).toHaveLength(1)
  })

  it('drops results outside Belarus', () => {
    const places = mapNominatimResults(
      [
        {
          place_id: 30,
          osm_type: 'node',
          osm_id: 30,
          lat: '55.7',
          lon: '37.6',
          name: 'Минская улица',
          display_name: 'Минская улица, Москва',
          category: 'highway',
          type: 'residential',
          address: { city: 'Москва', country_code: 'ru' },
        },
      ],
      'Минская',
    )

    expect(places).toHaveLength(0)
  })
})

describe('searchPlaces (Nominatim)', () => {
  beforeEach(() => {
    clearNominatimCache()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends one request with accept-language=ru', async () => {
    vi.mocked(fetch).mockResolvedValue(
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

    expect(fetch).toHaveBeenCalledTimes(1)
    const url = String(vi.mocked(fetch).mock.calls[0]?.[0])
    expect(url).toContain('/api/nominatim/search?')
    expect(url).toContain('accept-language=ru')
    expect(url).toContain('countrycodes=by')
    expect(url).toContain('addressdetails=1')
    expect(url).toContain('format=jsonv2')
    expect(places[0]?.title).toBe('Минск')
  })

  it('returns empty for short queries without fetching', async () => {
    const places = await searchPlaces('Ми')
    expect(places).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })
})
