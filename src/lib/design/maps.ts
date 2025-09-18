export const padTopMap = {
  none: 'pt-0',
  sm: 'pt-4',
  md: 'pt-8',
  lg: 'pt-12',
  xl: 'pt-20',
} as const;

export const padBottomMap = {
  none: 'pb-0',
  sm: 'pb-4',
  md: 'pb-8',
  lg: 'pb-12',
  xl: 'pb-20',
} as const;

export const widthMap = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
} as const;

export const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
} as const;

export const bgMap = {
  default: 'bg-background',
  subtle: 'relative isolate border-y bg-muted/50 dark:bg-muted/20',
  brand: 'relative isolate border-y bg-[#00222f]',
  surface: 'bg-transparent',
  image: 'relative isolate',
} as const;

export const variantContainerMap = {
  card: 'rounded-xl border bg-card',
  muted: 'rounded-xl bg-muted',
  none: '',
} as const;


