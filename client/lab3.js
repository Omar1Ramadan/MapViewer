

// intitalizing the map
document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([51.505, -0.09], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);
});

// constants for the limit of search
let currentPage = 1;
let resultsPerPage = 5;
let searchResults = [];
let favorites = {};

//The search function
async function searchDestinations() {
    // defining the terms
    const field = document.getElementById('search-field').value;
    const query = document.getElementById('search-query').value;
    const limit = resultsPerPage;

    // creating the fetch request to backend
    const response = await fetch(`/api/destinations/search?field=${field}&pattern=${query}&n=${limit}`);
    const data = await response.json();
    searchResults = data
    displayResults()
   
}

function displayResults() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.textContent = ""; // Clear previous results

    const start = (currentPage - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    const pageResults = searchResults.slice(start, end);

    pageResults.forEach((destination) => {
        // Create container for each result
        const card = document.createElement("div");
        card.classList.add("result-card");

        // Title
        const title = document.createElement("h3");
        title.textContent = destination.name;
        card.appendChild(title);

        // Region
        const region = document.createElement("p");
        region.textContent = `Region: ${destination.region}`;
        card.appendChild(region);

        // Country
        const country = document.createElement("p");
        country.textContent = `Country: ${destination.country}`;
        card.appendChild(country);

        // Currency
        const currency = document.createElement("p");
        currency.textContent = `Currency: ${destination.currency}`;
        card.appendChild(currency);

        // Language
        const language = document.createElement("p");
        language.textContent = `Language: ${destination.language}`;
        card.appendChild(language);

        // Button to add to favorites
        const addButton = document.createElement("button");
        addButton.textContent = "Add to Favorites";
        addButton.addEventListener("click", () => addToFavorites(destination.destinationID));
        card.appendChild(addButton);

        resultsDiv.appendChild(card);

        // Add marker to map
        L.marker([destination.coordinates.latitude, destination.coordinates.longitude])
            .addTo(map)
            .bindPopup(`<b>${destination.name}</b>`)
            .openPopup();
    });

}

function updateResultsPerPage() {
    resultsPerPage = parseInt(document.getElementById("results-per-page").value);
    currentPage = 1;
    displayResults();
}

function nextPage() {
    if ((currentPage * resultsPerPage) < searchResults.length) {
        currentPage++;
        displayResults();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayResults();
    }
}