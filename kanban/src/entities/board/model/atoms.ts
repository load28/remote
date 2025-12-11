import { atom } from 'jotai';
import type { Board } from './types';

export const boardsAtom = atom<Board[]>([]);

export const currentBoardIdAtom = atom<string | null>(null);

export const currentBoardAtom = atom<Board | null>((get) => {
  const boards = get(boardsAtom);
  const currentId = get(currentBoardIdAtom);
  if (!currentId) return null;
  return boards.find((b) => b.id === currentId) ?? null;
});

export const setBoardsAtom = atom(null, (_get, set, boards: Board[]) => {
  set(boardsAtom, boards);
});

export const updateBoardInListAtom = atom(null, (get, set, updatedBoard: Board) => {
  const boards = get(boardsAtom);
  const updated = boards.map((b) => (b.id === updatedBoard.id ? updatedBoard : b));
  set(boardsAtom, updated);
});

export const addBoardAtom = atom(null, (get, set, newBoard: Board) => {
  const boards = get(boardsAtom);
  set(boardsAtom, [...boards, newBoard]);
});

export const removeBoardAtom = atom(null, (get, set, boardId: string) => {
  const boards = get(boardsAtom);
  set(boardsAtom, boards.filter((b) => b.id !== boardId));
});
