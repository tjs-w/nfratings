try {
  importScripts(
    chrome.runtime.getURL("logger.js"),
    chrome.runtime.getURL("common.js")
  ); // Load utils before executing this script
} catch (error) {
  logger.error("Error loading dependencies:", error);
}

let apiKey: string | null = null;

/**
 * Function to fetch ratings from OMDB API
 * @param title - The title of the movie/series to fetch ratings for
 * @returns A promise that resolves with the ratings data or null if an error occurs
 */
async function fetchRatingsHandler(title: string): Promise<any> {
  if (!apiKey) {
    await initializeExtension();
    if (!apiKey) {
      logger.error("API key is not available");
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
      (rating: any) => rating?.Source === "Rotten Tomatoes"
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

/**
 * Function to initialize the extension by loading necessary settings from storage
 */
async function initializeExtension(): Promise<void> {
  logger.debug("Logger level: ", logger.getLevel());
  try {
    const result = await chromeStorageGet([
      "NFRatingsSettings",
      "NFRatingsData",
    ]);
    if (result.NFRatingsSettings?.apiKey) {
      apiKey = result.NFRatingsSettings.apiKey;
      logger.debug("API key fetched");
    } else {
      logger.error("OMDb API key is not set in localStorage");
    }
  } catch (error) {
    logger.error("Error initializing extension:", error);
  }
}

// Event listener for extension installation
chrome.runtime.onInstalled.addListener(() => {
  logger.debug("NFRatings successfully installed!");
  initializeExtension();
});

// Event listener for extension startup
chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
});

// Message handlers for content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.action) {
      case "fetchRatings":
        circuitBreaker(fetchRatingsHandler)(message.title)
          .then((ratings) => {
            sendResponse({ status: "success", ratings });
          })
          .catch((error: any) => {
            logger.error("Error fetching ratings: ", error.message);
            sendResponse({ status: "error", error: error.message });
          });
        break;
      default:
        logger.warn("Unknown action: ", message.action);
        sendResponse({ status: "error", error: "Unknown action" });
        break;
    }
  } catch (error: any) {
    logger.error("Error handling message ", message.action, ":", error);
    sendResponse({ status: "error", error: error.message });
  }
  return true; // Indicates that the response will be sent asynchronously
});

export { fetchRatingsHandler }; // Add this export statement
// Add this export statement
