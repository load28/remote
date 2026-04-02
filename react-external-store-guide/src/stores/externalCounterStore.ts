type Listener = () => void;

let count = 0;
const listeners = new Set<Listener>();

export const counterStore = {
  subscribe(callback: Listener) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  getSnapshot() {
    return count;
  },
  getServerSnapshot() {
    return 0;
  },
  increment() {
    count++;
    listeners.forEach((l) => l());
  },
  decrement() {
    count--;
    listeners.forEach((l) => l());
  },
  set(value: number) {
    count = value;
    listeners.forEach((l) => l());
  },
};
