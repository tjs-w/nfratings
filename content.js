let cardContainerMap = {};

// 7 days in milliseconds for dict `titleToRatingsMap`
const TTL = 7 * 24 * 60 * 60 * 1000;
let titleToRatingsMap = {};

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

let taskQueue = Promise.resolve(); // Initialize a task queue

// Function to fetch ratings for a title with retry mechanism
async function fetchRatings(title, retries = 3) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "fetchRatings",
      title,
    });

    if (response.status === "success") {
      console.debug("%cRatings:", "color: green;", response.ratings);
      return response.ratings;
    } else {
      console.error("%cFailed to fetch ratings", "color: red;", response.error);
      return null;
    }
  } catch (error) {
    if (retries > 0) {
      console.warn("%cRetry fetching ratings:", "color: orange;", retries - 1);
      return fetchRatings(title, retries - 1);
    } else {
      console.error("%cError fetching ratings:", "color: red;", error);
      return null;
    }
  }
}

function getTitleToRatingsMap() {
  return chromeStorageGet(["NFRatingsData"])
    .then((result) => {
      const serializedMap = result.NFRatingsData?.titleToRatingsMap;
      if (!serializedMap) {
        console.info(
          "%cNo titleToRatingsMap found in local storage",
          "color: blue;"
        );
        return {};
      }

      const map = JSON.parse(serializedMap);
      const now = Date.now();
      let updated = 0,
        evictions = 0;
      const initialCount = Object.keys(map).length;

      for (const title in map) {
        const { timestamp } = map[title];
        if (now - timestamp >= TTL) {
          if (Math.random() < 0.5) {
            // Randomly evict entries wtih 50% probability
            delete map[title];
            evictions++;
          } else {
            // Fetch recent ratings for the remaining entries
            fetchRatings(title)
              .then((ratings) => {
                if (ratings) {
                  map[title] = fetchRatings(title);
                  updated++;
                }
              })
              .catch((error) => {
                console.error(
                  `%cError fetching ratings for title: ${title}`,
                  "color: red;",
                  error
                );
              });
          }
        }
      }

      const finalCount = Object.keys(map).length;
      if (evictions > 0 || updated > 0) {
        chromeStorageSet({
          "NFRatingsData.titleToRatingsMap": JSON.stringify(map),
        }).then(() => {
          console.info(
            `%cLoaded ${initialCount} entries from local storage, updated ${updated}, evicted ${evictions}, ${finalCount} entries remain`,
            "color: orange;"
          );
        });
      } else {
        console.info(
          `%cLoaded ${initialCount} entries from local storage, ${finalCount} entries remain`,
          "color: blue;"
        );
      }

      return map;
    })
    .catch((error) => {
      console.error(
        "%cError loading titleToRatingsMap from local storage:",
        "color: red;",
        error
      );
      return {};
    });
}

// Function to set the titleToRatingsMap and save it to local storage
async function setTitleToRatingsMap(newMap) {
  try {
    console.info(
      `%cSaving ${
        Object.keys(titleToRatingsMap).length
      } entries to local storage`,
      "color: blue;"
    );
    await chromeStorageSet({
      NFRatingsData: { titleToRatingsMap: JSON.stringify(titleToRatingsMap) },
    });
    console.info(
      "%cTitleToRatingsMap successfully saved to local storage",
      "color: green;"
    );
  } catch (error) {
    console.error(
      "%cError saving titleToRatingsMap to local storage:",
      "color: red;",
      error
    );
  }
}

// Function to extract title from the element
function extractTitle(element) {
  return element.textContent
    .trim()
    .replace(/- Netflix$/, "")
    .replace(/\(.*\)$/, "")
    .trim();
}

// Function to create IMDb rating element
function createIMDBRating(imdbRating, imdbID) {
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
  imdbRatingText.textContent = imdbRating;

  imdbLink.appendChild(imdbLogo);
  imdbLink.appendChild(imdbRatingText);

  return imdbLink;
}

// Function to create Tomato rating element
function createTomatoRating(tomatoMeter, title) {
  let rtLogoSrc;
  if (tomatoMeter >= 75) {
    rtLogoSrc = certifiedFreshLogoURL; // Certified Fresh
  } else if (tomatoMeter >= 60) {
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
  rtRatingText.textContent = `${tomatoMeter}%`;

  rtLink.appendChild(rtLogo);
  rtLink.appendChild(rtRatingText);

  return rtLink;
}

// Function to create Tomato user rating element
function createTomatoUserRating(tomatoUserRating, title) {
  let rtUserLogoSrc, rtUserLogoWidth;
  if (tomatoUserRating >= 60) {
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
  rtUserRatingText.textContent = `${tomatoUserRating}%`;

  rtUserLink.appendChild(rtUserLogo);
  rtUserLink.appendChild(rtUserRatingText);

  return rtUserLink;
}

// Function to create the ratings container
function createRatingsContainer(ratings, title) {
  const { imdbRating, imdbID, tomatoMeter, tomatoUserRating } = ratings || {};
  const newRatingsContainer = document.createElement("div");
  newRatingsContainer.classList.add("ratings-container"); // Add a class for easier identification
  newRatingsContainer.style.display = "flex";
  newRatingsContainer.style.alignItems = "center";
  newRatingsContainer.style.marginTop = "12px";

  // Append ratings if present
  if (imdbRating) {
    newRatingsContainer.appendChild(createIMDBRating(imdbRating, imdbID));
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
async function applyFadeEffect(container, ratings) {
  settings = await chromeStorageGet(["NFRatingsSettings"]);
  const filter = settings.NFRatingsSettings?.filter || {};
  if (!filter) {
    console.error("%cError fetching filter settings", "color: red;");
  }

  const { minIMDbScore, minTomatoScore, minPopcornScore } = filter;
  container.style.opacity = "1";

  if (
    ratings?.imdbRating &&
    minIMDbScore &&
    parseFloat(ratings.imdbRating) < minIMDbScore
  ) {
    container.style.opacity = "0.2";
  }

  if (
    ratings?.tomatoMeter &&
    minTomatoScore &&
    parseFloat(ratings.tomatoMeter) < minTomatoScore
  ) {
    container.style.opacity = "0.2";
  }

  if (
    ratings?.tomatoUserRating &&
    minPopcornScore &&
    parseFloat(ratings.tomatoUserRating) < minPopcornScore
  ) {
    container.style.opacity = "0.2";
  }
}

// Function to add ratings to titles
async function addRatingsToTitles() {
  const titleCardContainers = document.querySelectorAll(
    ".title-card-container"
  );
  let isRatingsFetched = false;

  for (const container of titleCardContainers) {
    const cardElement = container.querySelector(".title-card");
    if (!cardElement) {
      console.error("%cCard element not found for container", "color: red;");
      continue; // Skip if card element is not found
    }

    const titleElement = container.querySelector(".fallback-text");
    if (!titleElement) {
      console.error("%cTitle element not found for container", "color: red;");
      continue; // Skip if title element is not found
    }

    const title = extractTitle(titleElement);
    if (!title) {
      console.error(`%cTitle not found for title: ${title}`, "color: red;");
      continue; // Skip if title is not found in the map
    }

    const existingRatingsContainer =
      container.querySelector(".ratings-container");
    if (existingRatingsContainer) {
      // console.debug(
      //   `%cRatings container already exists for title: ${title}`,
      //   "color: green;"
      // );
      if (title in titleToRatingsMap) {
        applyFadeEffect(container, titleToRatingsMap[title].ratings);
      }

      continue; // Skip further processing if the ratingsContainer already exists in the DOM
    }

    if (!(title in cardContainerMap)) {
      let ratings = titleToRatingsMap[title]?.ratings;
      if (!ratings) {
        console.debug(`Fetching ratings for title: ${title}`);
        ts = Date.now();
        ratings = await fetchRatings(title);
        console.debug(`Fetched in time: ${Date.now() - ts}ms`);
        if (!ratings) {
          console.error(
            `%cFailed fetching ratings for title: ${title}`,
            "color: red;"
          );
          continue;
        }
        titleToRatingsMap[title] = { ratings: ratings, timestamp: Date.now() };
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
async function handleTitleUpdates() {
  taskQueue = taskQueue
    .then(async () => {
      await addRatingsToTitles();
    })
    .catch((error) => {
      console.error("%cError updating titles:", "color: red;", error);
    });
}

// Function to initialize the script
async function initialize() {
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
    console.error("%cError during initialization:", "color: red;", error);
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
