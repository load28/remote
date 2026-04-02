type Listener = () => void;

export function createLocalStorageStore(key: string) {
  const listeners = new Set<Listener>();

  function subscribe(callback: Listener) {
    listeners.add(callback);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(callback);
      window.removeEventListener("storage", handleStorage);
    };
  }

  function getSnapshot(): string | null {
    return localStorage.getItem(key);
  }

  function getServerSnapshot(): null {
    return null;
  }

  function setValue(newValue: string | null) {
    if (newValue === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, newValue);
    }
    listeners.forEach((listener) => listener());
  }

  return { subscribe, getSnapshot, getServerSnapshot, setValue };
}
