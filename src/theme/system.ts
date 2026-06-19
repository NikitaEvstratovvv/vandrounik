import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

/**
 * Vandrounik design tokens (Chakra v3).
 * Источник — переменные Figma (mAysLALLcMDA07FqvFno5B), извлечённые через
 * get_variable_defs. Нейтральная shadcn-палитра. Значения 1:1 с макетом.
 */
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Прямое соответствие Figma-переменным.
        background: { value: '#ffffff' }, // --background
        foreground: { value: '#0a0a0a' }, // --foreground
        primary: { value: '#171717' }, // --primary
        primaryFg: { value: '#fafafa' }, // --primary-foreground
        secondary: { value: '#f5f5f5' }, // --secondary / --accent
        secondaryFg: { value: '#0a0a0a' }, // --secondary-foreground
        muted: { value: '#737373' }, // --muted-foreground
        line: { value: '#e5e5e5' }, // --border
        screen: { value: '#f6f6f6' }, // фон холста экрана (frame bg)
        canvas: { value: '#000000' }, // фон вне приложения (десктоп / поля viewport)
      },
      fonts: {
        body: { value: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
        heading: { value: "'Oswald', system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
      },
      fontSizes: {
        xs: { value: '12px' }, // size/xs
        sm: { value: '14px' }, // size/sm
        base: { value: '16px' }, // size/base
        title: { value: '28px' }, // заголовки экранов (Oswald)
        sheetTitle: { value: '24px' }, // заголовок bottom sheet
        wordmark: { value: '48px' }, // логотип-надпись на сплэше
        tagline: { value: '18px' }, // подзаголовок сплэша
      },
      lineHeights: {
        xs: { value: '16px' }, // leading/4
        sm: { value: '20px' }, // leading/5
        base: { value: '24px' }, // leading/6
        title: { value: '36px' },
      },
      fontWeights: {
        normal: { value: 400 }, // weight/normal
        medium: { value: 500 }, // weight/medium
        semibold: { value: 600 }, // weight/semibold
        bold: { value: 700 },
      },
      radii: {
        checkbox: { value: '6px' }, // radius-sm
        sm: { value: '6px' },
        btn: { value: '10px' }, // radius-lg (квадратные кнопки 36px)
        seg: { value: '16px' }, // активный сегмент
        card: { value: '20px' }, // карточки / основной CTA
        sheet: { value: '24px' }, // верхние углы bottom sheet
        pill: { value: '32px' }, // поля ввода (поиск, длительность)
        full: { value: '999px' },
      },
      shadows: {
        // Box Shadow/shadow-xs из Figma
        xs: { value: '0px 1px 2px 0px rgba(0,0,0,0.1)' },
        // Box Shadow/shadow-lg из Figma (карточки E2, поповеры)
        lg: {
          value:
            '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
        },
        // drop-shadow на primary-кнопках и активном сегменте
        btn: { value: '0px 1px 1px 0px rgba(0,0,0,0.1)' },
        // тень выбранного чекбокса
        check: { value: '0px 1.25px 2.5px 0px rgba(0,0,0,0.1)' },
      },
    },
  },
  globalCss: {
    body: {
      bg: 'canvas',
      color: 'foreground',
      fontFamily: 'body',
    },
  },
})

export const system = createSystem(defaultConfig, config)

export const appMeta = {
  name: 'Vandrounik',
  description: 'Планирование автопутешествий по Беларуси',
} as const
