import { AppProviders } from './providers/AppProviders';
import { ChatPage } from './ChatPage';

export function App() {
  return (
    <AppProviders>
      <ChatPage />
    </AppProviders>
  );
}
