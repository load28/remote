'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Board, CreateBoardDto } from './types';
import { Column, CreateColumnDto } from '@/entities/column';
import { Card, CreateCardDto, UpdateCardDto } from '@/entities/card';
import { STORAGE_KEYS } from '@/shared/config';

interface BoardState {
  boards: Board[];
  currentBoardId: string | null;

  // Board actions
  createBoard: (dto: CreateBoardDto) => Board;
  updateBoard: (boardId: string, title: string) => void;
  deleteBoard: (boardId: string) => void;
  setCurrentBoard: (boardId: string | null) => void;
  getCurrentBoard: () => Board | null;

  // Column actions
  createColumn: (dto: CreateColumnDto) => void;
  updateColumn: (columnId: string, title: string) => void;
  deleteColumn: (columnId: string) => void;

  // Card actions
  createCard: (dto: CreateCardDto) => void;
  updateCard: (cardId: string, dto: UpdateCardDto) => void;
  deleteCard: (cardId: string) => void;
  moveCard: (cardId: string, targetColumnId: string, targetOrder: number) => void;
}

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      currentBoardId: null,

      createBoard: (dto) => {
        const now = new Date().toISOString();
        const boardId = uuidv4();

        const columns: Column[] = DEFAULT_COLUMNS.map((title, index) => ({
          id: uuidv4(),
          title,
          boardId,
          order: index,
          cards: [],
          createdAt: now,
        }));

        const newBoard: Board = {
          id: boardId,
          title: dto.title,
          columns,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          boards: [...state.boards, newBoard],
          currentBoardId: boardId,
        }));

        return newBoard;
      },

      updateBoard: (boardId, title) => {
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === boardId
              ? { ...board, title, updatedAt: new Date().toISOString() }
              : board
          ),
        }));
      },

      deleteBoard: (boardId) => {
        set((state) => ({
          boards: state.boards.filter((board) => board.id !== boardId),
          currentBoardId:
            state.currentBoardId === boardId ? null : state.currentBoardId,
        }));
      },

      setCurrentBoard: (boardId) => {
        set({ currentBoardId: boardId });
      },

      getCurrentBoard: () => {
        const { boards, currentBoardId } = get();
        return boards.find((b) => b.id === currentBoardId) || null;
      },

      createColumn: (dto) => {
        const now = new Date().toISOString();

        set((state) => ({
          boards: state.boards.map((board) => {
            if (board.id !== dto.boardId) return board;

            const newColumn: Column = {
              id: uuidv4(),
              title: dto.title,
              boardId: dto.boardId,
              order: board.columns.length,
              cards: [],
              createdAt: now,
            };

            return {
              ...board,
              columns: [...board.columns, newColumn],
              updatedAt: now,
            };
          }),
        }));
      },

      updateColumn: (columnId, title) => {
        set((state) => ({
          boards: state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((column) =>
              column.id === columnId ? { ...column, title } : column
            ),
            updatedAt: new Date().toISOString(),
          })),
        }));
      },

      deleteColumn: (columnId) => {
        set((state) => ({
          boards: state.boards.map((board) => ({
            ...board,
            columns: board.columns.filter((column) => column.id !== columnId),
            updatedAt: new Date().toISOString(),
          })),
        }));
      },

      createCard: (dto) => {
        const now = new Date().toISOString();

        set((state) => ({
          boards: state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((column) => {
              if (column.id !== dto.columnId) return column;

              const newCard: Card = {
                id: uuidv4(),
                title: dto.title,
                description: dto.description,
                columnId: dto.columnId,
                order: column.cards.length,
                createdAt: now,
                updatedAt: now,
              };

              return {
                ...column,
                cards: [...column.cards, newCard],
              };
            }),
            updatedAt: now,
          })),
        }));
      },

      updateCard: (cardId, dto) => {
        const now = new Date().toISOString();

        set((state) => ({
          boards: state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((column) => ({
              ...column,
              cards: column.cards.map((card) =>
                card.id === cardId
                  ? { ...card, ...dto, updatedAt: now }
                  : card
              ),
            })),
            updatedAt: now,
          })),
        }));
      },

      deleteCard: (cardId) => {
        set((state) => ({
          boards: state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((column) => ({
              ...column,
              cards: column.cards.filter((card) => card.id !== cardId),
            })),
            updatedAt: new Date().toISOString(),
          })),
        }));
      },

      moveCard: (cardId, targetColumnId, targetOrder) => {
        set((state) => {
          let movedCard: Card | null = null;

          // Find and remove the card from its current column
          const updatedBoards = state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((column) => {
              const cardIndex = column.cards.findIndex((c) => c.id === cardId);
              if (cardIndex !== -1) {
                movedCard = { ...column.cards[cardIndex] };
                return {
                  ...column,
                  cards: column.cards.filter((c) => c.id !== cardId),
                };
              }
              return column;
            }),
          }));

          if (!movedCard) return state;

          // Add the card to the target column at the target position
          const finalBoards = updatedBoards.map((board) => ({
            ...board,
            columns: board.columns.map((column) => {
              if (column.id !== targetColumnId) return column;

              const newCards = [...column.cards];
              const updatedCard = {
                ...movedCard!,
                columnId: targetColumnId,
                order: targetOrder,
                updatedAt: new Date().toISOString(),
              };

              newCards.splice(targetOrder, 0, updatedCard);

              // Update order for all cards
              return {
                ...column,
                cards: newCards.map((card, index) => ({
                  ...card,
                  order: index,
                })),
              };
            }),
            updatedAt: new Date().toISOString(),
          }));

          return { boards: finalBoards };
        });
      },
    }),
    {
      name: STORAGE_KEYS.BOARDS,
    }
  )
);
