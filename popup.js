document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("api-key-input");
  const toggleApiKey = document.getElementById("toggle-api-key");
  const saveApiKeyButton = document.getElementById("save-api-key");
  const minIMDbScoreSlider = document.getElementById("min-imdb-score");
  const minTomatoScoreSlider = document.getElementById("min-tomato-score");
  const minPopcornScoreSlider = document.getElementById("min-popcorn-score");
  const applySettingsButton = document.getElementById("apply-settings");
  const resetSettingsButton = document.querySelector(".reset-settings-button");

  // Load the stored API key and filter settings from chrome.storage.local
  chrome.storage.local.get(["NFRatingsSettings"], (result) => {
    if (result.NFRatingsSettings && result.NFRatingsSettings.apiKey) {
      apiKeyInput.value = result.NFRatingsSettings.apiKey;
    }

    if (result.NFRatingsSettings && result.NFRatingsSettings.filter) {
      const filter = result.NFRatingsSettings.filter;
      if (filter.minIMDbScore !== undefined) {
        minIMDbScoreSlider.value = filter.minIMDbScore;
        document.getElementById("imdb-score-value").textContent =
          filter.minIMDbScore;
      }
      if (filter.minTomatoScore !== undefined) {
        minTomatoScoreSlider.value = filter.minTomatoScore;
        document.getElementById("tomato-score-value").textContent =
          filter.minTomatoScore + "%";
      }
      if (filter.minPopcornScore !== undefined) {
        minPopcornScoreSlider.value = filter.minPopcornScore;
        document.getElementById("popcorn-score-value").textContent =
          filter.minPopcornScore + "%";
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
          document.querySelector(".collapsible").classList.remove("active");
          document.querySelector(".content").style.display = "none";

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
    document.getElementById("imdb-score-value").textContent =
      minIMDbScoreSlider.value;
  });

  minTomatoScoreSlider.addEventListener("input", () => {
    document.getElementById("tomato-score-value").textContent =
      minTomatoScoreSlider.value + "%";
  });

  minPopcornScoreSlider.addEventListener("input", () => {
    document.getElementById("popcorn-score-value").textContent =
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

    chrome.storage.local.get(["NFRatingsSettings"], (result) => {
      const settings = result.NFRatingsSettings || {};
      settings.filter = filter;
      chrome.storage.local.set({ NFRatingsSettings: settings }, () => {
        document.getElementById("status").textContent = "Settings applied.";
        document.getElementById("status").style.color = "grey";

        // Collapse the API key section after applying settings
        document.querySelector(".collapsible").classList.remove("active");
        document.querySelector(".content").style.display = "none";

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
      document.getElementById("status").textContent = "";
    }, 5000);
  });

  // Reset settings button
  resetSettingsButton.addEventListener("click", () => {
    minIMDbScoreSlider.value = 0;
    minTomatoScoreSlider.value = 0;
    minPopcornScoreSlider.value = 0;
    document.getElementById("imdb-score-value").textContent = "0";
    document.getElementById("tomato-score-value").textContent = "0%";
    document.getElementById("popcorn-score-value").textContent = "0%";
  });

  // Toggle collapsible content
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach((collapsible) => {
    collapsible.addEventListener("click", function () {
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      if (content.style.display === "block") {
        content.style.display = "none";
      } else {
        content.style.display = "block";
      }
    });
  });
});
