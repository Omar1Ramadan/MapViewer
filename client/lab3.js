// intitalizing the map
const map = L.map("map").setView([51.505, -0.09], 4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
}).addTo(map);

// constants for the limit of search
let currentPage = 1;
let resultsPerPage = 5;
let searchResults = [];
let favorites = {};
let markersLayer;

//The search function
async function searchDestinations() {
    // defining the terms
    const field = document.getElementById('search-field').value;
    const query = document.getElementById('search-query').value;
    const resultsPerPageInput = parseInt(document.getElementById("results-per-page").value);
    resultsPerPage = resultsPerPageInput || 5;
    currentPage = 1;

    // creating the fetch request to backend
    const response = await fetch(`/api/destinations/search?field=${field}&pattern=${query}&n=${resultsPerPageInput}`);
    const data = await response.json();
    searchResults = data
    displayResults()
   
}

//function to create or update lits
async function createFavoriteList(){
    // creating constants for favorite list
    const listName = document.getElementById('list-name').value.trim();
    const destinationIDsInput = document.getElementById('destination-ids').value.trim();

    // need to add some input validation HERE
    if(!listName)
        return alert("Please Input a valid name");

    
    const destinationIDs = destinationIDsInput.split(',').map( id => id.trim()).filter(id => id);

    try{
        const response = await fetch('/api/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/JSON'
            },
            body: JSON.stringify( {listName, destinationIDs})
        })

        const result = await response.json();
        
        if(result.ok)
            return console.log(result.message);
        else{
            console.log(result.error || "failed to create or update list")
        }


    }catch(error){
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
}

// function to get faviorate lists
async function retrieveFavoriteList(){

    const listName = document.getElementById('retrieve-list-name').value.trim();

    if(!listName)
        return alert("Please enter a listName");

    try{
        const response = await fetch(`/api/list/${listName}/details`)
        const data = await response.json();

        if(response.ok){
            console.log("Data:", data); // Add this line to inspect the data
            return displayFavoriteList(data)
        }
        else{
            alert(data.error && "List is not Found")
        }

    }catch(error){
        console.error("Error:", error.message);
        alert("An error occurred. Please try again.");
    }
}



// Function to update results per page and refresh display
function updateResultsPerPage() {
    resultsPerPage = parseInt(document.getElementById("results-per-page").value) || 5;
    currentPage = 1; // Reset to first page
    displayResults();
}

// Function to display results and map
function displayResults() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.textContent = ""; // Clear previous results

    const start = (currentPage - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    const pageResults = searchResults.slice(start, end);

     // Clear any previous markers
     if (markersLayer) {
        markersLayer.clearLayers();
    }
        markersLayer = L.layerGroup().addTo(map);

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

         // Add marker to map for each destination
         const marker = L.marker([destination.Latitude, destination.Longitude])
         .bindPopup(`<b>${destination.Destination}</b><br>${destination.Region}, ${destination.Country}`);
            markersLayer.addLayer(marker);

    });
}

let currentFavoriteListData = null; // Store the latest favorite list data

function displayFavoriteList(data) {
    const { listName, destinationDetails } = data;
    currentFavoriteListData = data;
    
    // Clear the current display
    const resultsContainer = document.getElementById('favorite-results');
    resultsContainer.innerHTML = '';

    // Display the list name
    const listTitle = document.createElement('h2');
    listTitle.textContent =  listName
    resultsContainer.appendChild(listTitle);

    //Sort the items
    const sortBy = document.getElementById('favorite-sort-by').value;

    // sorting the array of details 
    const sortedDetails = [...destinationDetails].sort((a,b) => {
        if(a[sortBy] > b[sortBy]) return -1;
        if(a[sortBy] < b[sortBy]) return 1
        return 0;
    })

    // Display each destination in the list
    sortedDetails.forEach(destination => {
        // Create a card for each destination
        const card = document.createElement('div');
        card.classList.add('destination-card');

        // Name
        const nameElement = document.createElement('h3');
        nameElement.textContent = destination.name;
        card.appendChild(nameElement);

        // Region
        const regionElement = document.createElement('p');
        regionElement.textContent = `Region: ${destination.region}`;
        card.appendChild(regionElement);

        // Country
        const countryElement = document.createElement('p');
        countryElement.textContent = `Country: ${destination.country}`;
        card.appendChild(countryElement);

        // Coordinates
        const coordinatesElement = document.createElement('p');
        coordinatesElement.textContent = `Coordinates: ${destination.coordinates.latitude}, ${destination.coordinates.longitude}`;
        card.appendChild(coordinatesElement);

        // Currency
        const currencyElement = document.createElement('p');
        currencyElement.textContent = `Currency: ${destination.currency}`;
        card.appendChild(currencyElement);

        // Language
        const languageElement = document.createElement('p');
        languageElement.textContent = `Language: ${destination.language}`;
        card.appendChild(languageElement);

        // Append the card to the results container
        resultsContainer.appendChild(card);
    });
}

//Helper function to update by sort
function updateFavoriteSortOrder() {
    if (currentFavoriteListData) {
        displayFavoriteList(currentFavoriteListData);
    }
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
        console.log(currentPage)
        displayResults();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        console.log(currentPage)
        displayResults();
    }
}