/// <reference types="chrome"/>

// Define types for the ratings data
type Ratings = {
  imdbRating: string | null;
  imdbID: string | null;
  tomatoMeter: string | null;
  tomatoUserRating: string | null;
} | null;

type TitleToRatingsMap = {
  [key: string]: {
    ratings: Ratings;
    timestamp: number;
  };
};

// Initialize variables
let cardContainerMap: { [key: string]: any } = {};
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
let titleToRatingsMap: TitleToRatingsMap = {};

// Global image URLs
const imdbLogoURL =
  "https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg";
const certifiedFreshLogoURL =
  "https://upload.wikimedia.org/wikipedia/en/b/b2/Certified_Fresh_2018.svg";
const freshLogoURL =
  "https://upload.wikimedia.org/wikipedia/commons/5/5b/Rotten_Tomatoes.svg";
const rottenLogoURL =
  "https://upload.wikimedia.org/wikipedia/commons/5/52/Rotten_Tomatoes_rotten.svg";
const userFreshLogoURL =
  "https://upload.wikimedia.org/wikipedia/commons/d/da/Rotten_Tomatoes_positive_audience.svg";
const userRottenLogoURL =
  "https://upload.wikimedia.org/wikipedia/commons/6/63/Rotten_Tomatoes_negative_audience.svg";

let taskQueue: Promise<void> = Promise.resolve(); // Initialize a task queue

// Function to fetch ratings for a title with retry mechanism
const fetchRatings = circuitBreaker(
  async (title: string): Promise<Ratings | null> => {
    const response: any = await chrome.runtime.sendMessage({
      action: "fetchRatings",
      title,
    });
    if (response?.status === "success") {
      if (response.ratings == null) {
        throw new Error(`Failed to fetch ratings: null`);
      }
      logger.debug("%cRatings:", "color: green;", response.ratings);
      return response.ratings as Ratings;
    }
    throw new Error(`Failed to fetch ratings: ${response?.error}`);
  }
);

// Function to get titleToRatingsMap from storage
async function getTitleToRatingsMap(): Promise<TitleToRatingsMap> {
  try {
    const result = await chromeStorageGet(["NFRatingsData"]);
    const serializedMap = result.NFRatingsData?.titleToRatingsMap;
    if (!serializedMap) {
      logger.info(
        "%cNo titleToRatingsMap found in local storage",
        "color: blue;"
      );
      return {};
    }

    const map: TitleToRatingsMap = JSON.parse(serializedMap);
    const now = Date.now();
    let updated = 0;
    const initialCount = Object.keys(map).length;

    for (const title in map) {
      const { timestamp } = map[title];
      if (now - timestamp >= TTL && Math.random() < 0.33) {
        // Fetch recent ratings for the entries older than TTL 1/3rd of the time
        const ratings = await fetchRatings(title);
        if (ratings) {
          map[title] = { ratings, timestamp: Date.now() };
          updated++;
        }
      }
    }

    const finalCount = Object.keys(map).length;
    if (updated > 0) {
      await chromeStorageSet({
        "NFRatingsData.titleToRatingsMap": JSON.stringify(map),
      });
      logger.info(
        `%cLoaded ${initialCount} entries from local storage, updated ${updated}, ${finalCount} entries remain`,
        "color: orange;"
      );
    }

    return map;
  } catch (error) {
    logger.error(
      "%cError loading titleToRatingsMap from local storage:",
      error
    );
    return {};
  }
}

// Function to set the titleToRatingsMap and save it to local storage
async function setTitleToRatingsMap(newMap: TitleToRatingsMap): Promise<void> {
  try {
    logger.info(
      `%cSaving ${
        Object.keys(titleToRatingsMap).length
      } entries to local storage`,
      "color: blue;"
    );
    await chromeStorageSet({
      NFRatingsData: { titleToRatingsMap: JSON.stringify(titleToRatingsMap) },
    });
    logger.info(
      "%cTitleToRatingsMap successfully saved to local storage",
      "color: green;"
    );
  } catch (error) {
    logger.error(
      "%cError saving titleToRatingsMap to local storage:",

      error
    );
  }
}

// Function to extract title from the element
function extractTitle(element: Element): string {
  return (
    element.textContent
      ?.trim()
      .replace(/- Netflix$/, "")
      .replace(/\(.*\)$/, "")
      .trim() || ""
  );
}

// Function to create IMDb rating element
function createIMDBRating(imdbRating: string, imdbID: string): HTMLElement {
  const imdbLink = document.createElement("a");
  imdbLink.href = `https://www.imdb.com/title/${imdbID}`;
  imdbLink.target = "_blank";
  imdbLink.rel = "noopener noreferrer";
  imdbLink.style.display = "flex";
  imdbLink.style.alignItems = "center";
  imdbLink.style.marginRight = "10px";

  const imdbLogo = document.createElement("img");
  imdbLogo.src = imdbLogoURL;
  imdbLogo.alt = "IMDb";
  imdbLogo.style.width = "24px";
  imdbLogo.style.height = "auto";
  imdbLogo.style.marginRight = "5px";

  const imdbRatingText = document.createElement("span");
  imdbRatingText.style.fontWeight = "bold";
  imdbRatingText.style.fontSize = "1.2em";
  imdbRatingText.textContent = imdbRating || "";

  imdbLink.appendChild(imdbLogo);
  imdbLink.appendChild(imdbRatingText);

  return imdbLink;
}

// Function to create Tomato rating element
function createTomatoRating(
  tomatoMeter: string | null,
  title: string
): HTMLElement {
  let rtLogoSrc: string;
  if (tomatoMeter && parseFloat(tomatoMeter) >= 75) {
    rtLogoSrc = certifiedFreshLogoURL; // Certified Fresh
  } else if (tomatoMeter && parseFloat(tomatoMeter) >= 60) {
    rtLogoSrc = freshLogoURL; // Fresh
  } else {
    rtLogoSrc = rottenLogoURL; // Rotten
  }

  const rtLink = document.createElement("a");
  rtLink.href = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(
    title
  )}`;
  rtLink.target = "_blank";
  rtLink.rel = "noopener noreferrer";
  rtLink.style.display = "flex";
  rtLink.style.alignItems = "center";
  rtLink.style.marginRight = "10px";

  const rtLogo = document.createElement("img");
  rtLogo.src = rtLogoSrc;
  rtLogo.alt = "Rotten Tomatoes";
  rtLogo.style.width = "22px";
  rtLogo.style.height = "auto";
  rtLogo.style.marginRight = "5px";

  const rtRatingText = document.createElement("span");
  rtRatingText.style.fontWeight = "bold";
  rtRatingText.style.fontSize = "1.2em";
  rtRatingText.textContent = `${tomatoMeter || "0"}%`;

  rtLink.appendChild(rtLogo);
  rtLink.appendChild(rtRatingText);

  return rtLink;
}

// Function to create Tomato user rating element
function createTomatoUserRating(
  tomatoUserRating: string | null,
  title: string
): HTMLElement {
  let rtUserLogoSrc: string, rtUserLogoWidth: string;
  if (tomatoUserRating && parseFloat(tomatoUserRating) >= 60) {
    rtUserLogoSrc = userFreshLogoURL; // Full popcorn bucket
    rtUserLogoWidth = "14px";
  } else {
    rtUserLogoSrc = userRottenLogoURL; // Spilled popcorn bucket
    rtUserLogoWidth = "20px";
  }

  const rtUserLink = document.createElement("a");
  rtUserLink.href = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(
    title
  )}`;
  rtUserLink.target = "_blank";
  rtUserLink.rel = "noopener noreferrer";
  rtUserLink.style.display = "flex";
  rtUserLink.style.alignItems = "center";

  const rtUserLogo = document.createElement("img");
  rtUserLogo.src = rtUserLogoSrc;
  rtUserLogo.alt = "Rotten Tomatoes User";
  rtUserLogo.style.width = rtUserLogoWidth;
  rtUserLogo.style.height = "auto";
  rtUserLogo.style.marginRight = "5px";

  const rtUserRatingText = document.createElement("span");
  rtUserRatingText.style.fontWeight = "bold";
  rtUserRatingText.style.fontSize = "1.2em";
  rtUserRatingText.textContent = `${tomatoUserRating || "0"}%`;

  rtUserLink.appendChild(rtUserLogo);
  rtUserLink.appendChild(rtUserRatingText);

  return rtUserLink;
}

// Function to create the ratings container
function createRatingsContainer(
  ratings: Ratings | null,
  title: string
): HTMLElement {
  const { imdbRating, imdbID, tomatoMeter, tomatoUserRating } = ratings || {};
  const newRatingsContainer = document.createElement("div");
  newRatingsContainer.classList.add("ratings-container"); // Add a class for easier identification
  newRatingsContainer.style.display = "flex";
  newRatingsContainer.style.alignItems = "center";
  newRatingsContainer.style.marginTop = "12px";

  // Append ratings if present
  if (imdbRating) {
    newRatingsContainer.appendChild(createIMDBRating(imdbRating, imdbID ?? ""));
  }
  if (tomatoMeter) {
    newRatingsContainer.appendChild(createTomatoRating(tomatoMeter, title));
  }
  if (tomatoUserRating) {
    newRatingsContainer.appendChild(
      createTomatoUserRating(tomatoUserRating, title)
    );
  }

  return newRatingsContainer;
}

// Function to apply fade effect based on ratings
async function applyFadeEffect(
  container: Element,
  ratings: Ratings
): Promise<void> {
  const settings = await chromeStorageGet(["NFRatingsSettings"]);
  const filter = settings.NFRatingsSettings?.filter || {};
  if (!filter) {
    logger.error("%cError fetching filter settings", "color: red;");
  }

  const { minIMDbScore, minTomatoScore, minPopcornScore } = filter;
  (container as HTMLElement).style.opacity = "1";

  if (
    ratings?.imdbRating &&
    minIMDbScore &&
    parseFloat(ratings.imdbRating) < minIMDbScore
  ) {
    (container as HTMLElement).style.opacity = "0.2";
  }

  if (
    ratings?.tomatoMeter &&
    minTomatoScore &&
    parseFloat(ratings.tomatoMeter) < minTomatoScore
  ) {
    (container as HTMLElement).style.opacity = "0.2";
  }

  if (
    ratings?.tomatoUserRating &&
    minPopcornScore &&
    parseFloat(ratings.tomatoUserRating) < minPopcornScore
  ) {
    (container as HTMLElement).style.opacity = "0.2";
  }
}

// Function to add ratings to titles
async function addRatingsToTitles(): Promise<void> {
  const titleCardContainers = document.querySelectorAll(
    ".title-card-container"
  );
  let isRatingsFetched = false;

  for (const container of titleCardContainers) {
    const cardElement = container.querySelector(".title-card");
    if (!cardElement) {
      logger.error("%cCard element not found for container", "color: red;");
      continue; // Skip if card element is not found
    }

    const titleElement = container.querySelector(".fallback-text");
    if (!titleElement) {
      logger.error("%cTitle element not found for container", "color: red;");
      continue; // Skip if title element is not found
    }

    const title = extractTitle(titleElement);
    if (!title) {
      logger.error(`%cTitle not found for title: ${title}`, "color: red;");
      continue; // Skip if title is not found in the map
    }

    const existingRatingsContainer =
      container.querySelector(".ratings-container");
    if (existingRatingsContainer) {
      // logger.debug(
      //   `%cRatings container already exists for title: ${title}`,
      //   "color: green;"
      // );
      if (title in titleToRatingsMap) {
        applyFadeEffect(container, titleToRatingsMap[title].ratings);
      }

      continue; // Skip further processing if the ratingsContainer already exists in the DOM
    }

    if (!(title in cardContainerMap)) {
      let ratings: Ratings | null = titleToRatingsMap[title]?.ratings;
      if (!ratings) {
        ratings = await fetchRatings(title);
        if (!ratings) {
          logger.error(`%cFailed fetching ratings for title`, "color: red;");
          continue;
        }
        titleToRatingsMap[title] = { ratings, timestamp: Date.now() };
        isRatingsFetched = true;
      }
      cardContainerMap[title] = {
        ratingsContainer: createRatingsContainer(ratings, title),
      };
    }

    const { ratingsContainer } = cardContainerMap[title];
    container.appendChild(ratingsContainer.cloneNode(true));
  }

  if (isRatingsFetched) {
    await setTitleToRatingsMap(titleToRatingsMap);
  }
}

// Function to handle title updates in a queue (mutual exclusion)
async function handleTitleUpdates(): Promise<void> {
  taskQueue = taskQueue
    .then(async () => {
      await addRatingsToTitles();
    })
    .catch((error) => {
      logger.error("%cError updating titles:", error);
    });
}

// Function to initialize the script
async function initialize(): Promise<void> {
  try {
    titleToRatingsMap = (await getTitleToRatingsMap()) || {};
    await handleTitleUpdates(); // Call handleTitleUpdates instead of addRatingsToTitles

    // Add event listeners for scrolling and clicking
    window.addEventListener("scroll", () => {
      handleTitleUpdates();
    });

    window.addEventListener("click", () => {
      handleTitleUpdates();
    });

    window.addEventListener("load", () => {
      handleTitleUpdates();
    });
  } catch (error) {
    logger.error("%cError during initialization:", error);
  }
}

// Initialize on page load
window.addEventListener("load", initialize);

// Message Listener for Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "handleTitleUpdates") {
    handleTitleUpdates();
  }
});
