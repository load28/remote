// UI
export { BoardCard } from './ui';

// Model - Types
export type { Board, CreateBoardDto, UpdateBoardDto } from './model';

// Model - Store
export { useBoardStore } from './model';

// Model - Atoms
export {
  boardsAtom,
  currentBoardIdAtom,
  currentBoardAtom,
  setBoardsAtom,
  updateBoardInListAtom,
  addBoardAtom,
  removeBoardAtom,
} from './model';

// Model - Queries
export {
  useBoardsQuery,
  useBoardQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
} from './model';

// API
export { boardApi } from './api';
