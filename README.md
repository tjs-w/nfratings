# <span style="color:#e50914">NF</span>Ratings Chrome Extension

![NFRatings Logo](public/icons/icon_128.png)

NFRatings enhances your Netflix experience by integrating IMDb, Rotten Tomatoes Critics & User ratings directly on Netflix thumbnails.

## <img src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Google_Chrome_Web_Store_icon_2022.svg" alt="Chrome Web Store" width="20px"> Chrome Extension



Install the Chrome Extension publishded to Chrome Web Store [here]().

## Features
  
- **IMDb Ratings <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDb" width="30px"/>:** View IMDb ratings for each title.
- **Rotten Tomatoes Scores <img src="https://upload.wikimedia.org/wikipedia/commons/5/5b/Rotten_Tomatoes.svg" alt="Rotten Tomatoes Critics" width="20px">:** Access Tomatometer and Audience Score.
- **Customizable Filters <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Rotten_Tomatoes_positive_audience.svg" alt="Rotten Tomatoes Users" width="18px">:** Set minimum rating thresholds to filter out low-rated content.
- **Real-time Updates**: Ratings are fetched and displayed in real-time.

## Developer Setup

1. **Clone the Repository**:

   ```sh
   git clone https://github.com/yourusername/nfratings.git
   cd nfratings
   ```

2. **Install Dependencies:**

    ```sh
    npm install
    ```

3. **Build the Extension**

    ```sh
    npm run build
    ```

    Debug:
    ```
    npm run watch
    ```

4. **Load the Extension in Chrome:**

    - Open `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the build directory.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
