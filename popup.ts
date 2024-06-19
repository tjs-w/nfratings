document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
  const toggleApiKey: HTMLElement = document.getElementById("toggle-api-key") as HTMLElement;
  const saveApiKeyButton: HTMLElement = document.getElementById("save-api-key") as HTMLElement;
  const minIMDbScoreSlider: HTMLInputElement = document.getElementById("min-imdb-score") as HTMLInputElement;
  const minTomatoScoreSlider: HTMLInputElement = document.getElementById("min-tomato-score") as HTMLInputElement;
  const minPopcornScoreSlider: HTMLInputElement = document.getElementById("min-popcorn-score") as HTMLInputElement;
  const applySettingsButton: HTMLElement = document.getElementById("apply-settings") as HTMLElement;
  const resetSettingsButton: HTMLElement = document.querySelector(".reset-settings-button") as HTMLElement;

  // Load the stored API key and filter settings from chrome.storage.local
  chrome.storage.local.get(["NFRatingsSettings"], (result: { NFRatingsSettings?: { apiKey?: string; filter?: { minIMDbScore?: number; minTomatoScore?: number; minPopcornScore?: number; }; }; }) => {
    if (result.NFRatingsSettings && result.NFRatingsSettings.apiKey) {
      apiKeyInput.value = result.NFRatingsSettings.apiKey;
    }

    if (result.NFRatingsSettings && result.NFRatingsSettings.filter) {
      const filter = result.NFRatingsSettings.filter;
      if (filter.minIMDbScore !== undefined) {
        minIMDbScoreSlider.value = filter.minIMDbScore.toString();
        document.getElementById("imdb-score-value")!.textContent =
          filter.minIMDbScore.toString();
      }
      if (filter.minTomatoScore !== undefined) {
        minTomatoScoreSlider.value = filter.minTomatoScore.toString();
        document.getElementById("tomato-score-value")!.textContent =
          filter.minTomatoScore.toString();
      }
      if (filter.minPopcornScore !== undefined) {
        minPopcornScoreSlider.value = filter.minPopcornScore.toString();
        document.getElementById("popcorn-score-value")!.textContent =
          filter.minPopcornScore.toString();
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
      chrome.storage.local.get(["NFRatingsSettings"], (result: { NFRatingsSettings?: { apiKey?: string; filter?: any; }; }) => {
        const settings = result.NFRatingsSettings || {};
        settings.apiKey = apiKey;
        chrome.storage.local.set({ NFRatingsSettings: settings }, () => {
          document.querySelector(".collapsible")!.classList.remove("active");
          document.querySelector(".content")!.style.display = "none";

          // Send a message to the content script to apply the filter
          chrome.tabs.query({ url: "https://www.netflix.com/*" }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, { action: "handleTitleUpdates" });
            });
          });
        });
      });
    }
  });

  // Update slider values on input
  minIMDbScoreSlider.addEventListener("input", () => {
    document.getElementById("imdb-score-value")!.textContent =
      minIMDbScoreSlider.value;
  });

  minTomatoScoreSlider.addEventListener("input", () => {
    document.getElementById("tomato-score-value")!.textContent =
      minTomatoScoreSlider.value + "%";
  });

  minPopcornScoreSlider.addEventListener("input", () => {
    document.getElementById("popcorn-score-value")!.textContent =
      minPopcornScoreSlider.value + "%";
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

    chrome.storage.local.get(["NFRatingsSettings"], (result: { NFRatingsSettings?: { apiKey?: string; filter?: any; }; }) => {
      const settings = result.NFRatingsSettings || {};
      settings.filter = filter;
      chrome.storage.local.set({ NFRatingsSettings: settings }, () => {
        document.getElementById("status")!.textContent = "Settings applied.";
        document.getElementById("status")!.style.color = "grey";

        // Collapse the API key section after applying settings
        document.querySelector(".collapsible")!.classList.remove("active");
        document.querySelector(".content")!.style.display = "none";

        // Send a message to the content script to apply the filter
        chrome.tabs.query({ url: "*://www.netflix.com/*" }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, { action: "handleTitleUpdates" });
          });
        });
      });
    });

    // Clear the status message after 5 seconds
    setTimeout(() => {
      document.getElementById("status")!.textContent = "";
    }, 5000);
  });

  // Reset settings button
  resetSettingsButton.addEventListener("click", () => {
    minIMDbScoreSlider.value = "0";
    minTomatoScoreSlider.value = "0";
    minPopcornScoreSlider.value = "0";
    document.getElementById("imdb-score-value")!.textContent = "0";
    document.getElementById("tomato-score-value")!.textContent = "0%";
    document.getElementById("popcorn-score-value")!.textContent = "0%";
  });

  // Toggle collapsible content
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach((collapsible) => {
    collapsible.addEventListener("click", function () {
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