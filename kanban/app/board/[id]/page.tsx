import { BoardPage } from '@/pages/board';

interface Props {
  params: { id: string };
}

export default function Page({ params }: Props) {
  return <BoardPage boardId={params.id} />;
}
