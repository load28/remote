// T-13: named exported interface

export interface CustomEmoji {
  id: string;
  name: string;
  imageUrl: string;
  createdBy: string;
}

export interface CreateCustomEmojiInput {
  name: string;
  imageUrl: string;
}

export interface EmojiCategory {
  name: string;
  emojis: string[];
}
