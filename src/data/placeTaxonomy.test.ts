import { describe, expect, it } from 'vitest'
import { enrichRoutePlace, interestMarkerColor, primaryInterest, resolvePlaceTaxonomy } from './placeTaxonomy'

describe('placeTaxonomy', () => {
  it('maps known types to interest and typeGroup', () => {
    expect(resolvePlaceTaxonomy('Замок')).toEqual({
      interest: 'castles',
      typeGroup: 'fortresses',
      typeGroupLabel: 'Крепости',
    })
    expect(resolvePlaceTaxonomy('ДОТ')).toEqual({
      interest: 'dots',
      typeGroup: 'dots',
      typeGroupLabel: 'ДОТы',
    })
    expect(resolvePlaceTaxonomy('Собор')?.typeGroupLabel).toBe('Христианские храмы')
  })

  it('picks primary interest from list', () => {
    expect(primaryInterest(['estates', 'castles'])).toBe('estates')
    expect(primaryInterest(['dots'])).toBe('dots')
  })

  it('returns marker color per interest', () => {
    expect(interestMarkerColor('dots')).toBe('#5C6370')
    expect(interestMarkerColor('castles')).toBe('#2D6A4F')
  })

  it('enriches route place with taxonomy fields', () => {
    expect(
      enrichRoutePlace({
        type: 'Дворец',
        interests: ['estates'],
      }),
    ).toMatchObject({
      typeGroup: 'palaces',
      typeGroupLabel: 'Дворцы',
    })
  })
})
