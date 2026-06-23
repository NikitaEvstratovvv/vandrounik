type IconProps = { size?: number; strokeWidth?: number }

/** lucide/chevron-right — используется в виджет-кнопках E1 (16px). */
export function ChevronRight({ size = 16, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** lucide/chevron-left — кнопка «назад» в шапке (24px). */
export function ChevronLeft({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** lucide/arrow-down-up — кнопка swap «откуда/куда» (16px). */
export function ArrowDownUp({ size = 16, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 16 4 4 4-4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 20V4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="m21 8-4-4-4 4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 4v16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** lucide/check — галочка в выбранном чекбоксе. */
export function CheckIcon({ size = 15, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** remix/search — иконка в поле поиска (24px). */
export function SearchIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

/** remix/close — крестик закрытия (bottom sheet). */
export function CloseIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

/** remix/close-circle — очистка поля поиска. */
export function CloseCircleIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="m15 9-6 6m0-6 6 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

/** lucide/plus — зум карты (24px). */
export function PlusIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

/** hugeicons/minus-sign — зум карты (24px). */
export function MinusIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

/** hugeicons/racing-flag — маркеры старта/финиша на карте (Figma node 264:930). */
export function RacingFlagIcon({ size = 16 }: Pick<IconProps, 'size'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 13.2001 14.5332"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.38123 8.53945C5.26669 9.88786 7.93335 4.49422 12.6 7.19104L10.6 1.12311C7.54932 -0.933519 4.30859 3.83737 0.60002 2.34991L3.9334 13.9331"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.2667 3.9331C7.60002 1.26645 4.60002 7.26638 1.60002 5.26637"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.93335 2.53627L5.81571 7.93309M7.38433 1.26643L9.26669 6.34579"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
