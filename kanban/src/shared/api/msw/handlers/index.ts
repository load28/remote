import { authHandlers } from './auth';
import { boardHandlers } from './boards';
import { columnHandlers } from './columns';
import { cardHandlers } from './cards';
import { labelHandlers } from './labels';
import { memberHandlers } from './members';
import { checklistHandlers } from './checklists';
import { commentHandlers } from './comments';
import { activityHandlers } from './activities';

export const handlers = [
  ...authHandlers,
  ...boardHandlers,
  ...columnHandlers,
  ...cardHandlers,
  ...labelHandlers,
  ...memberHandlers,
  ...checklistHandlers,
  ...commentHandlers,
  ...activityHandlers,
];
