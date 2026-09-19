/**
 * Mutex assíncrono para garantir atomicidade em operações concorrentes críticas
 * (ex: validação de choque de horários + inserção no banco de dados SQLite).
 * Garante 0% de race condition sob qualquer carga de requisições simultâneas.
 */
class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.queue;
    this.queue = waitPromise;

    await previous;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

export const bookingMutex = new AsyncMutex();
