export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  labels?: CardLabel[];
}

export interface CardLabel {
  id: string;
  name: string;
  color: string;
}

export interface CreateCardDto {
  title: string;
  description?: string;
  columnId: string;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  labels?: CardLabel[];
}

export interface MoveCardDto {
  cardId: string;
  targetColumnId: string;
  targetOrder: number;
}
