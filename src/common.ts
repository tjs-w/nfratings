// common.ts

/**
 * Function to get data from chrome.storage.local
 * @param keys - The key(s) to retrieve from storage
 * @returns A promise that resolves with the retrieved data
 */
const chromeStorageGet = (
  keys: string | string[]
): Promise<{ [key: string]: any }> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (data) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Function to set data in chrome.storage.local
 * @param items - The key-value pairs to set in storage
 * @returns A promise that resolves when the data is set
 */
const chromeStorageSet = (items: { [key: string]: any }): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Function to create a circuit breaker
 * @param failureThreshold - The number of failures allowed before opening the circuit
 * @param retryTimeout - The time (in milliseconds) to wait before retrying after the circuit is open
 * @returns A function that acts as a circuit breaker for the provided function
 */
const createCircuitBreaker = (
  failureThreshold: number,
  retryTimeout: number
) => {
  let failureCount = 0;
  let lastFailureTime = 0;
  let state: "closed" | "half-open" | "open" = "closed";

  return <T extends (...args: any[]) => Promise<any>>(fn: T) =>
    async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      const ts = Date.now();

      if (state === "open") {
        if (Date.now() - lastFailureTime < retryTimeout) {
          logger.warn(`Circuit breaker is open. Skipping request`);
          return null;
        }
        state = "half-open";
      }

      try {
        const result = await fn(...args);
        logger.debug(`Fetch time: ${Date.now() - ts}ms`);

        if (state === "half-open") {
          state = "closed";
          failureCount = 0;
        }

        return result;
      } catch (error: any) {
        logger.error(`Error executing function: ${error.message}`);

        if (state === "half-open") {
          state = "open";
          lastFailureTime = Date.now();
          return null;
        }

        failureCount += 1;

        if (failureCount >= failureThreshold) {
          state = "open";
          lastFailureTime = Date.now();
          logger.warn(`Circuit breaker opened after ${failureCount} failures`);
        }

        return null;
      }
    };
};

const circuitBreaker = createCircuitBreaker(3, 600000);

// Attach functions to the global scope
(globalThis as any).chromeStorageGet = chromeStorageGet;
(globalThis as any).chromeStorageSet = chromeStorageSet;
(globalThis as any).createCircuitBreaker = createCircuitBreaker;
(globalThis as any).circuitBreaker = circuitBreaker;
