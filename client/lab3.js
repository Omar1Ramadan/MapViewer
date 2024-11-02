// intitalizing the map
document.addEventListener("DOMContentLoaded", () => {
    const map = L.map("map").setView([51.505, -0.09], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);
});

// constants for the limit of search
let currentPage = 1;
let resultsPerPage = 10;
let searchResults = [];
let favorites = {};

//The search function
async function searchDestinations() {
    // defining the terms
    const field = document.getElementById('search-field').value;
    const query = document.getElementById('search-query').value;
    const limit = resultsPerPage;

    // creating the fetch request to backend
    const response = await fetch(`http://localhost:3000/api/destinations/search?field=${field}&pattern=${query}&n=${limit}`);
    const data = await response.json();
    searchResults = data
    displayResults()
   
}

// Function to display results and map
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

        // Destination Title
        const title = document.createElement("h3");
        title.textContent = destination.Destination;
        card.appendChild(title);

        // Other Destination Details
        addDetail(card, "Region", destination.Region);
        addDetail(card, "Country", destination.Country);
        addDetail(card, "Category", destination.Category);
        addDetail(card, "Coordinates", `${destination.Latitude}, ${destination.Longitude}`);
        addDetail(card, "Approximate Annual Tourists", destination["Approximate Annual Tourists"]);
        addDetail(card, "Currency", destination.Currency);
        addDetail(card, "Majority Religion", destination["Majority Religion"]);
        addDetail(card, "Famous Foods", destination["Famous Foods"]);
        addDetail(card, "Language", destination.Language);
        addDetail(card, "Best Time to Visit", destination["Best Time to Visit"]);
        addDetail(card, "Cost of Living", destination["Cost of Living"]);
        addDetail(card, "Safety", destination.Safety);
        addDetail(card, "Cultural Significance", destination["Cultural Significance"]);
        addDetail(card, "Description", destination.Description);

        // Button to add to favorites
        const addButton = document.createElement("button");
        addButton.textContent = "Add to Favorites";
        addButton.addEventListener("click", () => addToFavorites(destination.destinationID));
        card.appendChild(addButton);

        resultsDiv.appendChild(card);

    });
}

// Helper function to add a destination detail
function addDetail(parent, label, value) {
    const detail = document.createElement("p");
    detail.textContent = `${label}: ${value}`;
    parent.appendChild(detail);
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