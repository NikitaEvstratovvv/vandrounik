import type { Interest } from '@/types'

/** Категории интересов для S2. Заголовки — 1:1 с макетом Figma (node 147:667). */
export const INTERESTS: Interest[] = [
  {
    id: 'estates',
    title: 'Усадьбы',
    description: 'Родовые поместья с флигелями, конюшнями и парками',
  },
  {
    id: 'castles',
    title: 'Замки',
    description: 'Средневековые крепости и оборонительные сооружения',
  },
  {
    id: 'temples',
    title: 'Храмы',
    description: 'Костёлы, церкви и монастыри',
  },
  {
    id: 'reserves',
    title: 'Заповедники',
    description: 'Природные парки и охраняемые территории',
  },
]
