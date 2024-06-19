importScripts("logger.js", "common.js"); // Load utils before executing this script

let apiKey = null;

// Function to fetch ratings
async function fetchRatings(title) {
  if (!apiKey) {
    await initializeExtension();
    if (!apiKey) {
      logger.error("%cAPI key is not available", "color: red;");
      return null;
    }
  }

  const ts = Date.now();
  const response = await fetch(
    `https://www.omdbapi.com/?t=${encodeURIComponent(
      title
    )}&apikey=${apiKey}&tomatoes=true`
  );
  if (!response.ok) {
    // Throw is needed for circuit breaker to work
    throw new Error(
      `HTTP error! status: ${response.status} ${
        response.statusText
      } ${await response.text()}`
    );
  }
  const data = await response.json();
  const tomatoMeterFromRating = () => {
    return data?.Ratings?.find(
      (rating) => rating?.Source === "Rotten Tomatoes"
    )?.Value.replace("%", "");
  };
  return {
    imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : null,
    imdbID: data.imdbID,
    tomatoMeter: data.tomatoMeter !== "N/A" ? data.tomatoMeter : null,
    tomatoUserRating:
      data.tomatoUserMeter !== "N/A"
        ? data.tomatoUserMeter
        : tomatoMeterFromRating(),
  };
}

async function initializeExtension() {
  logger.error(`Logger level: ${logger.level}`);
  try {
    const result = await chromeStorageGet([
      "NFRatingsSettings",
      "NFRatingsData",
    ]);
    if (result.NFRatingsSettings?.apiKey) {
      apiKey = result.NFRatingsSettings.apiKey;
      logger.debug("%cAPI key fetched", "color: green;");
    } else {
      logger.error("%cOMDb API key is not set in localStorage", "color: red;");
    }
  } catch (error) {
    logger.error("%cError initializing extension:", "color: red;", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  logger.debug("%cNFRatings successfully installed!", "color: green;");
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
});

// Message handlers for content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.action) {
      case "fetchRatings":
        circuitBreaker(fetchRatings)(message.title).then((ratings) => {
          sendResponse({ status: "success", ratings });
        });
        break;
      default:
        logger.warn("%cUnknown action:", "color: orange;", message.action);
        sendResponse({ status: "error", error: "Unknown action" });
        break;
    }
  } catch (error) {
    logger.error(
      `%cError handling message ${message.action}:`,
      "color: red;",
      error
    );
    sendResponse({ status: "error", error: error.message });
  }
  return true; // Indicates that the response will be sent asynchronously
});
