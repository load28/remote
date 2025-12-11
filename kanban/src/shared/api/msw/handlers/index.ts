import { authHandlers } from './auth';
import { boardHandlers } from './boards';
import { columnHandlers } from './columns';
import { cardHandlers } from './cards';

export const handlers = [
  ...authHandlers,
  ...boardHandlers,
  ...columnHandlers,
  ...cardHandlers,
];
