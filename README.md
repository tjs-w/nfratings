# <span style="color:#e50914">NF</span>Ratings Chrome Extension

![NFRatings Logo](public/icons/icon_128.png)

NFRatings enhances your Netflix experience by integrating IMDb, Rotten Tomatoes Critics & User ratings directly on Netflix thumbnails.

## <img src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Google_Chrome_Web_Store_icon_2022.svg" alt="Chrome Web Store" width="20px"> Chrome Extension

Install the Chrome Extension publishded to Chrome Web Store [here]().

## Features

- **IMDb Ratings:** View <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDb" width="30px"/> ratings for each title.
- **Rotten Tomatoes Scores:** AccViewess Tomatometer <img src="https://upload.wikimedia.org/wikipedia/commons/5/5b/Rotten_Tomatoes.svg" alt="Rotten Tomatoes Critics" width="20px"> and Audience Score <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Rotten_Tomatoes_positive_audience.svg" alt="Rotten Tomatoes Users" width="18px">.
- **Customizable Filters &#xe429;:** Set minimum rating thresholds to filter out low-rated content.

## Screenshots

### Ratings Applied

![Ratings](./public/screenshots/Ratings_1280x800.png)

### Filters Applied

![Filters](./public/screenshots/Filtered_1280x800.png)

### Popup Filter Settings

![PopupFilter](./public/screenshots/Popup_Filtered_1280x800.png)

### Popup ApiKey Settings

![PopupApiKey](./public/screenshots/Popup_ApiKey_1280x800.png)

## Getting the OMDb API Access Key

1. Go to <https://www.omdbapi.com/apikey.aspx> and fill in the details.
2. Create the Access Key and copy it from the email reply.
3. Save it from the popup window for the Extension in Chrome Browser.

## Developer Setup

### 1. Clone the Repository

```sh
git clone https://github.com/yourusername/nfratings.git
cd nfratings
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Build the Extension

```sh
npm run build
```

Debug:

```sh
npm run watch
```

### 4. Load the Extension in Chrome

- Open [chrome://extensions/](chrome://extensions/) tab
- Enable "Developer Mode"
- Click "Load unpacked" and select the build directory
- Click "Update" to load any changes to code in the directory

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
