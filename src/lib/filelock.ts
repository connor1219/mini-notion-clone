/**
 * Promise-chain file lock.
 *
 * Serializes all async operations that pass through it so only one
 * runs at a time. This prevents concurrent reads/writes from
 * corrupting the JSON data files.
 *
 * Usage:
 *   const lock = createFileLock();
 *   const result = await lock.withLock(() => readAndWriteFile());
 */

export interface FileLock {
  withLock<T>(fn: () => Promise<T>): Promise<T>;
}

export function createFileLock(): FileLock {
  let chain: Promise<void> = Promise.resolve();

  return {
    withLock<T>(fn: () => Promise<T>): Promise<T> {
      let release!: () => void;
      const next = new Promise<void>((res) => {
        release = res;
      });
      const result = chain.then(fn);
      chain = result.then(
        () => release(),
        () => release()
      ) as unknown as Promise<void>;
      return result;
    },
  };
}
