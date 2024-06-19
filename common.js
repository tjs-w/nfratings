// Function to get data from chrome.storage.local
const chromeStorageGet = (keys) => {
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

// Function to set data in chrome.storage.local
const chromeStorageSet = (items) => {
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

const createCircuitBreaker = (failureThreshold, retryTimeout) => {
  let failureCount = 0;
  let lastFailureTime = 0;
  let state = "closed";

  return (fn) =>
    async (...args) => {
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
      } catch (error) {
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

const circuitBreaker = createCircuitBreaker(3, 60000);
