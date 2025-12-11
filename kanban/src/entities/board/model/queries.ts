import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { queryKeys } from '@/shared/api/query';
import { boardApi } from '../api';
import { setBoardsAtom, addBoardAtom, updateBoardInListAtom, removeBoardAtom } from './atoms';
import type { CreateBoardDto, UpdateBoardDto } from './types';

export function useBoardsQuery() {
  const setBoards = useSetAtom(setBoardsAtom);

  return useQuery({
    queryKey: queryKeys.boards.all,
    queryFn: async () => {
      const boards = await boardApi.getAll();
      setBoards(boards);
      return boards;
    },
  });
}

export function useBoardQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.boards.detail(id),
    queryFn: () => boardApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient();
  const addBoard = useSetAtom(addBoardAtom);

  return useMutation({
    mutationFn: (dto: CreateBoardDto) => boardApi.create(dto),
    onSuccess: (newBoard) => {
      addBoard(newBoard);
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });
}

export function useUpdateBoardMutation() {
  const queryClient = useQueryClient();
  const updateBoardInList = useSetAtom(updateBoardInListAtom);

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBoardDto }) =>
      boardApi.update(id, dto),
    onSuccess: (updatedBoard) => {
      updateBoardInList(updatedBoard);
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(updatedBoard.id) });
    },
  });
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient();
  const removeBoard = useSetAtom(removeBoardAtom);

  return useMutation({
    mutationFn: (id: string) => boardApi.delete(id),
    onSuccess: (_, id) => {
      removeBoard(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });
}
