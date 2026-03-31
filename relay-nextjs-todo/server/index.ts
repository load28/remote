import { createServer } from 'http';
import { createSchema, createYoga } from 'graphql-yoga';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// =============================================================================
// In-memory 데이터 저장소
// 실제 프로덕션에서는 DB를 사용하지만, 학습 목적으로 메모리에 저장
// =============================================================================

interface TodoData {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

let nextId = 4;
const todos: TodoData[] = [
  { id: '1', text: 'Relay의 Fragment 패턴 학습하기', completed: true, createdAt: '2026-03-30T10:00:00Z' },
  { id: '2', text: 'Connection 기반 페이지네이션 구현하기', completed: false, createdAt: '2026-03-30T11:00:00Z' },
  { id: '3', text: 'Optimistic Update 적용하기', completed: false, createdAt: '2026-03-30T12:00:00Z' },
];

// =============================================================================
// Relay Connection 헬퍼
// cursor는 단순히 base64 인코딩된 인덱스 (실제로는 DB cursor 사용)
// =============================================================================

function encodeCursor(index: number): string {
  return Buffer.from(`cursor:${index}`).toString('base64');
}

function decodeCursor(cursor: string): number {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  return parseInt(decoded.replace('cursor:', ''), 10);
}

type TodoFilterType = 'ALL' | 'ACTIVE' | 'COMPLETED';

function buildConnection(
  allTodos: TodoData[],
  args: { first?: number | null; after?: string | null; filter?: TodoFilterType | null }
) {
  let filtered = allTodos;
  if (args.filter === 'ACTIVE') {
    filtered = allTodos.filter((t) => !t.completed);
  } else if (args.filter === 'COMPLETED') {
    filtered = allTodos.filter((t) => t.completed);
  }

  let startIndex = 0;
  if (args.after) {
    startIndex = decodeCursor(args.after) + 1;
  }

  const first = args.first ?? 10;
  const slice = filtered.slice(startIndex, startIndex + first);

  const edges = slice.map((todo, i) => ({
    cursor: encodeCursor(startIndex + i),
    node: todo,
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage: startIndex + first < filtered.length,
      hasPreviousPage: startIndex > 0,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    },
    totalCount: filtered.length,
  };
}

// =============================================================================
// GraphQL 스키마 + Resolvers
// =============================================================================

const typeDefs = readFileSync(resolve(__dirname, 'schema.graphql'), 'utf-8');

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      node: (_, { id }: { id: string }) => {
        const todo = todos.find((t) => t.id === id);
        if (todo) return { ...todo, __typename: 'Todo' };
        return null;
      },
      todos: (_, args: { first?: number | null; after?: string | null; filter?: TodoFilterType | null }) => {
        return buildConnection(todos, args);
      },
    },

    Node: {
      __resolveType: (obj: { __typename?: string }) => obj.__typename ?? 'Todo',
    },

    Mutation: {
      addTodo: (_, { input }: { input: { text: string } }) => {
        const newTodo: TodoData = {
          id: String(nextId++),
          text: input.text,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        todos.unshift(newTodo);

        return {
          todoEdge: {
            cursor: encodeCursor(0),
            node: newTodo,
          },
        };
      },

      updateTodo: (_, { input }: { input: { id: string; text: string } }) => {
        const todo = todos.find((t) => t.id === input.id);
        if (!todo) throw new Error(`Todo ${input.id} not found`);
        todo.text = input.text;
        return { todo };
      },

      toggleTodo: (_, { input }: { input: { id: string } }) => {
        const todo = todos.find((t) => t.id === input.id);
        if (!todo) throw new Error(`Todo ${input.id} not found`);
        todo.completed = !todo.completed;
        return { todo };
      },

      removeTodo: (_, { input }: { input: { id: string } }) => {
        const index = todos.findIndex((t) => t.id === input.id);
        if (index === -1) throw new Error(`Todo ${input.id} not found`);
        todos.splice(index, 1);
        return { deletedTodoId: input.id };
      },

      toggleAllTodos: (_, { input }: { input: { completed: boolean } }) => {
        const changed = todos.filter((t) => t.completed !== input.completed);
        changed.forEach((t) => {
          t.completed = input.completed;
        });
        return { changedTodos: changed };
      },
    },
  },
});

const yoga = createYoga({ schema });
const server = createServer(yoga);

server.listen(4000, () => {
  console.log('🚀 GraphQL server running at http://localhost:4000/graphql');
});
