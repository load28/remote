import { atom } from 'jotai';
import type { User, Session } from './types';

export const sessionAtom = atom<Session | null>(null);

export const currentUserAtom = atom<User | null>((get) => {
  const session = get(sessionAtom);
  return session?.user ?? null;
});

export const isAuthenticatedAtom = atom<boolean>((get) => {
  const user = get(currentUserAtom);
  return user !== null;
});
