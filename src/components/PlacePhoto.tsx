import { Box, Image } from '@chakra-ui/react'

type PlacePhotoProps = {
  src: string
}

/** Max preview height — full width, cover crop for taller Wiki photos. */
const PLACE_PHOTO_MAX_H = '360px'

/**
 * Превью места (Wiki/Commons): на всю ширину, высота до PLACE_PHOTO_MAX_H, лишнее — cover.
 */
export function PlacePhoto({ src }: PlacePhotoProps) {
  return (
    <Box w="full" h={PLACE_PHOTO_MAX_H} borderRadius="sm" overflow="hidden" bg="secondary" flexShrink={0}>
      <Image
        src={src}
        alt=""
        w="full"
        h="full"
        objectFit="cover"
        objectPosition="center"
        display="block"
      />
    </Box>
  )
}
