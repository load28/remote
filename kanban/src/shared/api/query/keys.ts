export const queryKeys = {
  boards: {
    all: ['boards'] as const,
    detail: (id: string) => ['boards', id] as const,
  },
  auth: {
    session: ['auth', 'session'] as const,
  },
} as const;
