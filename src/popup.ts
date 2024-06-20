document.addEventListener("DOMContentLoaded", async () => {
  // Get references to various elements in the DOM
  const apiKeyInput = document.getElementById(
    "api-key-input"
  ) as HTMLInputElement;
  const toggleApiKey = document.getElementById("toggle-api-key") as HTMLElement;
  const saveApiKeyButton = document.getElementById(
    "save-api-key"
  ) as HTMLButtonElement;
  const minIMDbScoreSlider = document.getElementById(
    "min-imdb-score"
  ) as HTMLInputElement;
  const minTomatoScoreSlider = document.getElementById(
    "min-tomato-score"
  ) as HTMLInputElement;
  const minPopcornScoreSlider = document.getElementById(
    "min-popcorn-score"
  ) as HTMLInputElement;
  const applySettingsButton = document.getElementById(
    "apply-settings"
  ) as HTMLButtonElement;
  const resetSettingsButton = document.querySelector(
    ".reset-settings-button"
  ) as HTMLButtonElement;

  // Set initial state of sliders to 0
  minIMDbScoreSlider.value = "0";
  minTomatoScoreSlider.value = "0";
  minPopcornScoreSlider.value = "0";
  (document.getElementById("imdb-score-value") as HTMLElement).textContent =
    "0";
  (document.getElementById("tomato-score-value") as HTMLElement).textContent =
    "0%";
  (document.getElementById("popcorn-score-value") as HTMLElement).textContent =
    "0%";

  // Load the stored API key and filter settings from chrome.storage.local
  chrome.storage.local.get(["NFRatingsSettings"], (result) => {
    if (result.NFRatingsSettings && result.NFRatingsSettings.apiKey) {
      apiKeyInput.value = result.NFRatingsSettings.apiKey;
    }

    if (result.NFRatingsSettings && result.NFRatingsSettings.filter) {
      const filter = result.NFRatingsSettings.filter;
      if (filter.minIMDbScore !== undefined) {
        minIMDbScoreSlider.value = filter.minIMDbScore.toString();
        (
          document.getElementById("imdb-score-value") as HTMLElement
        ).textContent = filter.minIMDbScore.toString();
      }
      if (filter.minTomatoScore !== undefined) {
        minTomatoScoreSlider.value = filter.minTomatoScore.toString();
        (
          document.getElementById("tomato-score-value") as HTMLElement
        ).textContent = filter.minTomatoScore + "%";
      }
      if (filter.minPopcornScore !== undefined) {
        minPopcornScoreSlider.value = filter.minPopcornScore.toString();
        (
          document.getElementById("popcorn-score-value") as HTMLElement
        ).textContent = filter.minPopcornScore + "%";
      }
    }
  });

  // Toggle the visibility of the API key
  if (toggleApiKey) {
    toggleApiKey.addEventListener("click", () => {
      if (apiKeyInput.type === "password") {
        apiKeyInput.type = "text";
        toggleApiKey.textContent = "visibility_off";
      } else {
        apiKeyInput.type = "password";
        toggleApiKey.textContent = "visibility";
      }
    });
  }

  // Save the API key to chrome.storage.local
  saveApiKeyButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.get(["NFRatingsSettings"], (result) => {
        const settings = result.NFRatingsSettings || {};
        settings.apiKey = apiKey;
        chrome.storage.local.set({ NFRatingsSettings: settings }, () => {
          (
            document.querySelector(".collapsible") as HTMLElement
          ).classList.remove("active");
          (document.querySelector(".content") as HTMLElement).style.display =
            "none";

          // Send a message to the content script to apply the filter
          chrome.tabs.query({ url: "https://www.netflix.com/*" }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id as number, {
                action: "handleTitleUpdates",
              });
            });
          });
        });
      });
    }
  });

  // Update slider values on input
  minIMDbScoreSlider.addEventListener("input", () => {
    (document.getElementById("imdb-score-value") as HTMLElement).textContent =
      minIMDbScoreSlider.value;
  });

  minTomatoScoreSlider.addEventListener("input", () => {
    (document.getElementById("tomato-score-value") as HTMLElement).textContent =
      minTomatoScoreSlider.value + "%";
  });

  minPopcornScoreSlider.addEventListener("input", () => {
    (
      document.getElementById("popcorn-score-value") as HTMLElement
    ).textContent = minPopcornScoreSlider.value + "%";
  });

  // Apply filter settings
  applySettingsButton.addEventListener("click", () => {
    const minIMDbScore = parseFloat(minIMDbScoreSlider.value);
    const minTomatoScore = parseFloat(minTomatoScoreSlider.value);
    const minPopcornScore = parseFloat(minPopcornScoreSlider.value);

    const filter = {
      minIMDbScore,
      minTomatoScore,
      minPopcornScore,
    };

    chrome.storage.local.get(["NFRatingsSettings"], (result) => {
      const settings = result.NFRatingsSettings || {};
      settings.filter = filter;
      chrome.storage.local.set({ NFRatingsSettings: settings }, () => {
        (document.getElementById("status") as HTMLElement).textContent =
          "Settings applied.";
        (document.getElementById("status") as HTMLElement).style.color = "grey";

        // Collapse the API key section after applying settings
        (
          document.querySelector(".collapsible") as HTMLElement
        ).classList.remove("active");
        (document.querySelector(".content") as HTMLElement).style.display =
          "none";

        // Send a message to the content script to apply the filter
        chrome.tabs.query({ url: "*://www.netflix.com/*" }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id as number, {
              action: "handleTitleUpdates",
            });
          });
        });
      });
    });

    // Clear the status message after 5 seconds
    setTimeout(() => {
      (document.getElementById("status") as HTMLElement).textContent = "";
    }, 5000);
  });

  // Reset settings button
  resetSettingsButton.addEventListener("click", () => {
    minIMDbScoreSlider.value = "0";
    minTomatoScoreSlider.value = "0";
    minPopcornScoreSlider.value = "0";
    (document.getElementById("imdb-score-value") as HTMLElement).textContent =
      "0";
    (document.getElementById("tomato-score-value") as HTMLElement).textContent =
      "0%";
    (
      document.getElementById("popcorn-score-value") as HTMLElement
    ).textContent = "0%";
  });

  // Toggle collapsible content
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach((collapsible) => {
    collapsible.addEventListener("click", function (this: HTMLElement) {
      this.classList.toggle("active");
      const content = this.nextElementSibling as HTMLElement;
      if (content.style.display === "block") {
        content.style.display = "none";
      } else {
        content.style.display = "block";
      }
    });
  });
});
