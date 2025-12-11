export { BoardCard } from './ui';
export type { Board, CreateBoardDto, UpdateBoardDto } from './model';
export { useBoardStore } from './model';
export {
  boardsAtom,
  currentBoardIdAtom,
  currentBoardAtom,
  setBoardsAtom,
  updateBoardInListAtom,
  addBoardAtom,
  removeBoardAtom,
} from './model/atoms';
export {
  useBoardsQuery,
  useBoardQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
} from './model/queries';
export { boardApi } from './api';
