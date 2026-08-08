type IconProps = { size?: number; strokeWidth?: number }

/** lucide/chevron-right — используется в виджет-кнопках E1 (16px). */
export function ChevronRight({ size = 16, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** remix/arrow-right-long — путь A→B в карточке E5 (16px). Figma 278:1351. */
export function ArrowRightLong({ size = 16 }: Pick<IconProps, 'size'>) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.449 8.242L10.091 11.601L10.031 11.542L12.224 9.352L13.29 8.284H1.625V8.201H13.29L12.224 7.134L10.031 4.942L10.091 4.884L13.449 8.242Z"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity={0.4}
      />
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

/** lucide/plus — зум карты / tab «Создать» (24px). */
export function PlusIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

/** lucide/pen — edit overlay на загруженном аватаре (Figma 351:2328, 20px). */
export function PenIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

/** phosphor/flag — бейджи Старт/Финиш в списке остановок (Figma XcPEo… 1529:32769). */
export function FlagIcon({ size = 14 }: Pick<IconProps, 'size'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18.0028 18.7492"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.25875 1.68665C0.178065 1.75659 0.113243 1.84295 0.0686202 1.93995C0.0239975 2.03696 0.000602508 2.14238 0 2.24915V17.9992C0 18.1981 0.0790178 18.3888 0.21967 18.5295C0.360322 18.6701 0.551088 18.7492 0.75 18.7492C0.948912 18.7492 1.13968 18.6701 1.28033 18.5295C1.42098 18.3888 1.5 18.1981 1.5 17.9992V13.8526C4.01156 11.8688 6.17531 12.9385 8.66719 14.1723C10.2047 14.9326 11.8603 15.752 13.6359 15.752C14.9419 15.752 16.3116 15.3067 17.7441 14.0645C17.8247 13.9945 17.8896 13.9082 17.9342 13.8112C17.9788 13.7142 18.0022 13.6087 18.0028 13.502V2.24915C18.0025 2.10519 17.9607 1.96438 17.8825 1.84351C17.8043 1.72265 17.693 1.62684 17.5618 1.56753C17.4306 1.50822 17.2852 1.48792 17.1428 1.50904C17.0004 1.53016 16.8671 1.59182 16.7587 1.68665C14.1337 3.95821 11.91 2.85759 9.33281 1.58165C6.66281 0.257901 3.63562 -1.23929 0.25875 1.68665ZM16.5 13.1476C13.9884 15.1313 11.8247 14.0607 9.33281 12.8279C6.98906 11.6701 4.38187 10.3782 1.5 12.0404V2.60446C4.01156 0.620714 6.17531 1.6904 8.66719 2.92321C11.0109 4.08103 13.6191 5.3729 16.5 3.71071V13.1476Z"
      />
    </svg>
  )
}

/**
 * remix/google — Figma 320:1721 / component 320:1602.
 * Vector 17.6×17.96 at (3,3) in 24×24; exact vectorPaths data from the file.
 */
export function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        transform="translate(3 3)"
        d="M9 8L17.532899856567383 8C17.576899856328964 8.384700000286102 17.600000381469727 8.779199600219727 17.600000381469727 9.183699607849121C17.600000381469727 11.918399572372437 16.620399475097656 14.220400929450989 14.922399520874023 15.783700942993164C13.436699509620667 17.15510094165802 11.404000043869019 17.959199905395508 8.979599952697754 17.959199905395508C5.469329833984375 17.959199905395508 2.4326601028442383 15.947000503540039 0.9551000595092773 13.012300491333008C0.34695005416870117 11.800000548362732 0 10.428599953651428 0 8.979599952697754C0 7.53059995174408 0.34695005416870117 6.159199953079224 0.9551000595092773 4.946979999542236C2.4326601028442383 2.0122599601745605 5.469329833984375 0 8.979599952697754 0C11.399999856948853 0 13.432599544525146 0.8898298740386963 14.987699508666992 2.338779926300049L13.52549934387207 3.8010101318359375C12.368199348449707 2.6815301179885864 10.802800059318542 2 9 2C5.134010076522827 2 2 5.134010076522827 2 9C2 12.865999937057495 5.134010076522827 16 9 16C12.52649998664856 16 15.144299656152725 13.392299890518188 15.57699966430664 10L9 10L9 8Z"
      />
    </svg>
  )
}

/** hugeicons/route-02 — tab «Мои маршруты» (24px). Figma 271:1350. */
export function RouteIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(1 1)">
        <path
          d="M17.7185 9.71513C17.5258 9.89786 17.2682 10 17.0001 10C16.732 10 16.4744 9.89786 16.2817 9.71513C14.5167 8.03169 12.1515 6.15111 13.305 3.42085C13.9286 1.94462 15.4257 1 17.0001 1C18.5745 1 20.0715 1.94462 20.6952 3.42085C21.8472 6.14767 19.4878 8.03749 17.7185 9.71513Z"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path
          d="M17 5h.009"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="4"
          cy="18"
          r="3"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 6H8.5C6.567 6 5 7.34315 5 9C5 10.6569 6.567 12 8.5 12H11.5C13.433 12 15 13.3431 15 15C15 16.6569 13.433 18 11.5 18H10"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/** hugeicons/user — tab «Профиль» (24px). Figma profile tab (lucide-compatible). */
export function UserIcon({ size = 24, strokeWidth = 2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
