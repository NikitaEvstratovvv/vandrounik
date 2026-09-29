import { describe, expect, it } from 'vitest'
import { expandQuery, localizeLabel } from '@/lib/geocoding/beRu'

describe('expandQuery', () => {
  it('adds і ↔ и', () => {
    expect(expandQuery('мин')).toEqual(expect.arrayContaining(['мин', 'мін']))
  })

  it('adds ова ↔ ава so Суворова finds Суворава', () => {
    expect(expandQuery('Суворова')).toEqual(
      expect.arrayContaining(['Суворова', 'Суворава']),
    )
  })

  it('swaps улица ↔ вуліца and combines with ова/ава', () => {
    const variants = expandQuery('улица Суворова')
    expect(variants).toEqual(expect.arrayContaining(['улица Суворова']))
    expect(variants.some((v) => /вуліца/i.test(v))).toBe(true)
    expect(variants.some((v) => /Суворава/i.test(v))).toBe(true)
    expect(variants.length).toBeLessThanOrEqual(6)
  })

  it('adds гродно ↔ гродна', () => {
    expect(expandQuery('гродно')).toEqual(
      expect.arrayContaining(['гродно', 'гродна']),
    )
  })

  it('adds Врублевского ↔ Урублеўскага for Grodno street', () => {
    expect(expandQuery('Врублевского 66')).toEqual(
      expect.arrayContaining(['Врублевского 66', 'Урублеўскага 66']),
    )
  })

  it('adds Дзержинского ↔ Дзяржынскага', () => {
    expect(expandQuery('Дзержинского')).toEqual(
      expect.arrayContaining(['Дзержинского', 'Дзяржынскага']),
    )
  })

  it('adds борисов ↔ барысаў', () => {
    expect(expandQuery('Борисов')).toEqual(
      expect.arrayContaining(['Борисов', 'Барысаў']),
    )
  })

  it('expands Brest fortress heroes street from Russian with ul. and housenumber', () => {
    const variants = expandQuery('ул. Героев обороны Брестской крепости, 60')
    expect(variants).toEqual(
      expect.arrayContaining([
        'ул. Героев обороны Брестской крепости, 60',
        'улица Героев обороны Брестской крепости 60',
        'вуліца Герояў Абароны Брэсцкай Крэпасці 60',
        'Герояў Абароны Брэсцкай Крэпасці 60',
      ]),
    )
  })
})

describe('localizeLabel', () => {
  it('localizes street + city + oblast', () => {
    expect(localizeLabel('вуліца Суворава')).toBe('улица Суворова')
    expect(localizeLabel('Гродна')).toBe('Гродно')
    expect(localizeLabel('Мінская вобласць')).toBe('Минская область')
  })

  it('localizes a full subtitle', () => {
    expect(
      localizeLabel('вуліца Суворава, Гродна, Гродзенская вобласць'),
    ).toBe('улица Суворова, Гродно, Гродненская область')
  })

  it('localizes Мінск', () => {
    expect(localizeLabel('Мінск')).toBe('Минск')
  })

  it('localizes Урублеўскага street into Russian', () => {
    expect(localizeLabel('вуліца Урублеўскага, 66, Гродна')).toBe(
      'улица Врублевского, 66, Гродно',
    )
  })

  it('localizes Дзяржынскага street into Russian', () => {
    expect(localizeLabel('праспект Дзяржынскага, Мінск')).toBe(
      'проспект Дзержинского, Минск',
    )
  })

  it('localizes Brest fortress heroes street into Russian', () => {
    expect(localizeLabel('вуліца Герояў Абароны Брэсцкай Крэпасці, Брэст')).toBe(
      'улица Героев обороны Брестской крепости, Брест',
    )
  })

  it('localizes Barysaw and Minsk region from Photon', () => {
    expect(localizeLabel('Barysaw')).toBe('Борисов')
    expect(localizeLabel('Барысаў, Minsk region')).toBe('Борисов, Минская область')
  })
})
