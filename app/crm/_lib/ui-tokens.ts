/**
 * Utilidades de clase alineadas con @theme en app/globals.css (Material-style).
 * Evita hex sueltos en pantallas CRM.
 */
export const TOK = {
  panel:
    'rounded-[var(--radius-lg)] bg-[var(--color-surface-container)]',
  panelPad: 'p-6 sm:p-8',
  label:
    'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]',
  textStrong: 'text-sm font-semibold text-[var(--color-on-surface)]',
  textMuted: 'text-sm text-[var(--color-on-surface-variant)]',
  textSubtle: 'text-[var(--color-on-surface-variant)]',
  fieldBg: 'bg-[var(--color-surface-container-low)]',
  select:
    'min-h-10 cursor-pointer rounded-[var(--radius-md)] border-0 bg-[var(--color-surface-container-lowest)] px-4 py-2.5 text-sm text-[var(--color-on-surface)] outline-none transition hover:bg-[var(--color-surface-container-low)] focus-visible:bg-[var(--color-surface-container-lowest)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  selectLg:
    'min-h-11 w-full rounded-[var(--radius-md)] border-0 bg-[var(--color-surface-container-low)] px-4 py-2.5 text-sm text-[var(--color-on-surface)] outline-none transition hover:bg-[var(--color-surface-container-high)] focus-visible:bg-[var(--color-surface-container-lowest)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  linkBack:
    'inline-flex w-fit items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-container)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  rowCard:
    'mb-2 grid items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-4 transition last:mb-0 hover:bg-[var(--color-surface-container-low)] lg:grid-cols-[2fr_1.8fr_.8fr_.8fr_.8fr] lg:py-3',
  emptyState:
    'rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] px-6 py-12 text-center',
  chipNewTag:
    'mr-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-fixed)] px-2.5 py-1 text-xs font-semibold text-[var(--color-on-primary-fixed)]',
  errorBox: 'mb-4 rounded-2xl bg-[var(--color-error-container)] px-4 py-3 text-sm text-[var(--color-on-error-container)]',
  linkAccent:
    'text-sm font-semibold text-[var(--color-on-surface)] transition-colors hover:text-[var(--color-primary)]',
  actionPrimary:
    'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-on-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface-container-lowest)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  actionSecondary:
    'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-container)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  actionAccent:
    'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-secondary-container)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-secondary-container)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  /** Inputs tipo píldora (modales CRM sin componente Input). */
  inputNative:
    'min-h-10 w-full rounded-[var(--radius-md)] border-0 bg-[var(--color-surface-container-low)] px-5 py-3 text-sm text-[var(--color-on-surface)] outline-none transition placeholder:text-[var(--color-on-surface-variant)]/60 hover:bg-[var(--color-surface-container-high)] focus-visible:bg-[var(--color-surface-container-lowest)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] disabled:cursor-not-allowed disabled:opacity-60',
  inputNativeMultiline:
    'w-full rounded-[var(--radius-md)] border-0 bg-[var(--color-surface-container-low)] px-5 py-3 text-sm text-[var(--color-on-surface)] outline-none transition placeholder:text-[var(--color-on-surface-variant)]/60 hover:bg-[var(--color-surface-container-high)] focus-visible:bg-[var(--color-surface-container-lowest)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] resize-none disabled:cursor-not-allowed disabled:opacity-60',
  inputCompact:
    'w-full rounded-[var(--radius-sm)] border-0 bg-[var(--color-surface-container-low)] px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  modalTitle:
    'text-xl font-semibold tracking-[-0.03em] text-[var(--color-on-surface)]',
  closeIconBtn:
    'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-surface-container-highest)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]',
  modalPanel:
    'w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-7 shadow-[var(--shadow-md)]',
  /** Títulos de bloque en páginas (dashboard, listados). */
  sectionTitle: 'text-lg font-semibold text-[var(--color-on-surface)]',
  sectionSubtitle: 'text-sm text-[var(--color-on-surface-variant)]',
  pagerLink:
    'rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm font-medium text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-container-high)]',
} as const
