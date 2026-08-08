import { describe, expect, it } from 'vitest'
import { commonsFileUrl, imageUrlFromOsmTags } from '@/lib/places/image'

describe('commonsFileUrl', () => {
  it('builds Special:FilePath URL', () => {
    expect(commonsFileUrl('File:Mir Castle.jpg')).toBe(
      'https://commons.wikimedia.org/wiki/Special:FilePath/Mir%20Castle.jpg?width=640',
    )
  })
})

describe('imageUrlFromOsmTags', () => {
  it('uses wikimedia_commons File:', () => {
    expect(imageUrlFromOsmTags({ wikimedia_commons: 'File:Foo.jpg' })).toContain('Special:FilePath/Foo.jpg')
  })

  it('skips google photos links', () => {
    expect(imageUrlFromOsmTags({ image: 'https://photos.app.goo.gl/abc' })).toBeUndefined()
  })

  it('keeps upload.wikimedia.org', () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Foo.jpg'
    expect(imageUrlFromOsmTags({ image: url })).toBe(url)
  })
})
