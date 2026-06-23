import { describe, expect, it } from 'vitest'
import { completeDurationForTransport, hoursToKm, kmToHours, minutesForDistanceKm } from './speed'

describe('transport speed helpers', () => {
  it('converts hours to kilometers by transport speed', () => {
    expect(hoursToKm(3, 'car')).toBe(270)
    expect(hoursToKm(3, 'bike')).toBe(60)
  })

  it('converts kilometers to hours by transport speed', () => {
    expect(kmToHours(100, 'bike')).toBe(5)
    expect(kmToHours(100, 'car')).toBe(1)
  })

  it('fills linked duration field for current transport', () => {
    expect(completeDurationForTransport({ unit: 'hours', hours: 3, km: null }, 'bike')).toEqual({
      unit: 'hours',
      hours: 3,
      km: 60,
    })
    expect(completeDurationForTransport({ unit: 'km', hours: null, km: 100 }, 'bike')).toEqual({
      unit: 'km',
      hours: 5,
      km: 100,
    })
  })

  it('converts distance to minutes by transport speed', () => {
    expect(minutesForDistanceKm(114, 'bike')).toBe(342)
    expect(minutesForDistanceKm(114, 'car')).toBe(76)
  })
})
