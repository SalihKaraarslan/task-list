// Design tokens. Every component reads colors and sizes from here, so the app looks consistent.

export const colors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  border: '#E2E5EA',
  text: '#1C1F26',
  textMuted: '#6B7280',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  primarySoft: '#DBEAFE',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const radius = { sm: 6, md: 10, lg: 14 } as const;

export const fontSize = { sm: 13, md: 15, lg: 17, xl: 26 } as const;
