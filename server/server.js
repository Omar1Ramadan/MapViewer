const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;
const csvparser = require('csv-parser');
const router = express.Router();
const joi = require('joi');
const Joi = require('joi');

//Setup serving front-end code
app.use('/', express.static('../client'));

//Setup serving data requests
app.use((req, res, next) => {
    console.log(`${req.method} Request: ${req.url}`);
    next();
});

// Add JSON parsing middleware
app.use(express.json());


//variables for global
let result = [];
const lists = {};
//a

path = './data/europe-destinations.csv'
// Function to load and parse CSV data into the `result` array
function loadCSVData() {
    result = []; // Clear existing data
    fs.createReadStream(path)
    .pipe(csvparser())
    .on('data', (row) => {
    // Normalize the headers by trimming whitespace and removing any non-printable characters
    const normalized = {};

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.trim().replace(/^\uFEFF/, ""); // Trim and remove BOM or other invisible characters
      normalized[normalizedKey] = value;
    }
    result.push(normalized);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  })
  .on('error', (error) => {
    console.error('Error loading CSV file:', error);
  });
}

// Load data on server start
loadCSVData();

// Optional: Watch the CSV file for changes to automatically reload data
fs.watchFile(path, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        console.log("CSV file changed. Reloading data...");
        loadCSVData();
    }
});

  router.route('/list/:listName/details')
  .get((req, res) => {
    const { listName } = req.params;

    // Schema to validate `listName` and `destinationIDs`
    const schema = joi.object({
      listName: joi.string().required().messages({
        "any.required": "List name is required",
        "string.empty": "List name cannot be empty"
      })
    });

    // Validate `listName`
    const { error } = schema.validate({ listName });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if the list exists in `lists`
    if (!lists[listName]) {
      return res.status(404).json({ error: `List '${listName}' not found` });
    }

    // Retrieve and validate destination IDs in the list
    const destinationIDs = lists[listName];
    console.log("Destination IDs in the list:", destinationIDs);

    if (!Array.isArray(destinationIDs) || destinationIDs.length === 0) {
      return res.status(404).json({ error: `No destinations found in list '${listName}'` });
    }

    // Fetch details for each destination based on validated indices
    const destinationDetails = destinationIDs.map(index => {
      // Validate that the index is within the bounds of `result`
      if (index >= 0 && index < result.length) {
        const destination = result[index];
        return {
          name: destination.Destination,
          region: destination.Region,
          country: destination.Country,
          coordinates: {
            latitude: destination.Latitude,
            longitude: destination.Longitude
          },
          currency: destination.Currency,
          language: destination.Language
        };
      } else {
        console.log(`Index ${index} is out of bounds`);
        return null;
      }
    }).filter(Boolean); // Filter out any nulls if indexes were out of bounds

    // Check if destination details were found
    if (destinationDetails.length === 0) {
      return res.status(404).json({ error: `No valid destinations found in the result data` });
    }

    // Send the detailed list as a response
    return res.json({ listName, destinationDetails });
  });

// any route with the list parameters
// Route for creating and retrieving lists
router.route('/list')
    .post((req, res) => {
        // Define schema with corrected usage of `messages()`
        const schema = Joi.object({
            listName: Joi.string().required().messages({
                "string.empty": "listName is required",
                "any.required": "listName is required"
            }),
            destinationIDs: Joi.array().items(Joi.number().integer().required())
        });

        // Validate the request body against the schema
        const { error, value } = schema.validate(req.body);

        if (error) {
            // Send a 400 Bad Request if validation fails
            return res.status(400).send({ error: error.details[0].message });
        }

        const { listName, destinationIDs } = value;

        // Check if list already exists
        if (!lists[listName]) {
            // Create a new list if it doesn't exist
            lists[listName] = destinationIDs || [];
            return res.status(201).send({ message: `List '${listName}' created successfully`, list: lists[listName] });
        }

        // Update the existing list with new destination IDs if provided
        lists[listName] = destinationIDs || lists[listName];
        return res.status(200).send({ message: `List '${listName}' updated successfully`, list: lists[listName] });
    })

    .get((req, res) => {
        res.send(lists);
    });

// Route to retrieve a specific list by name
router.route('/list/:listName') 
    // Get the listname params
    .get((req, res) => {
        const { listName } = req.params;

        // Check if the list exists
        if (!lists[listName]) {
            return res.status(404).send({ error: `List '${listName}' not found` });
        }

        // Return the list
        res.send({ listName, destinations: lists[listName] });
    }) // delete the listname params
    .delete((req,res) =>{
        const { listName } = req.params;

        // Check if the list exists 
        if(!lists[listName])
            return res.status(404).send( {error: `List ${listName} not found`})

        //Delete the list and confirm deletion
        delete lists[listName]
        res.send({ message: `List ${listName} deleted successfully`})
    })


router.get('/destinations/search', (req, res) => {
    const { field, pattern, n } = req.query; // Extract query parameters
    const limit = n ? parseInt(n, 10) : null; // Convert n to an integer or default to null

    //Define a schema to validate the query parameters
    let schema = joi.object({
        field: joi.string().required(),
        pattern: joi.string().required(),
        n: joi.number().integer().min(1).optional()
    })

    // Validating the schema
    const validation = schema.validate({ field, pattern, n : limit})
    if (validation.errror){
        return res.status(400).send({ error: validation.error.details[0].message })
    }

    //Filter information based on field and pattern
    const filter = result.filter(destination => {
        const  fieldValue = destination[field]
        return fieldValue && fieldValue.toLowerCase().includes(pattern.toLowerCase());
    });

    // Filter information based on field and pattern and map to get destinationID (index)
    const filteredIDs = result
        .map((destination, index) => ({ ...destination, destinationID: index })) // Add destinationID as index
        .filter(destination => {
            const fieldValue = destination[field];
            return fieldValue && fieldValue.toLowerCase().includes(pattern.toLowerCase());
        })
        .map(destination => destination.destinationID); // Extract only the destinationID

    // Limit the results if 'n' is provided, otherwise return all matches
    const limitedIDs = limit ? filteredIDs.slice(0, limit) : filteredIDs;
    res.send(limitedIDs);

});
// had to put the code above /:id otherwise it would think it would be reading the country as an id
// Define the API endpoint to retrieve data by country of the destination
router.get('/destinations/countries', (req,res) => {
    // Extract unique country names from the result array
    const countries = [...new Set(result.map(destination => destination.Country))];
    res.send(countries);
});

// Define the API endpoint to retrieve data by location of the destination
router.get('/destinations/:id/location', (req, res) => {
    const id = parseInt(req.params.id, 10); // Convert id to an integer
    
    // Defining the schema
    let schema = joi.object({
        location: joi.string().min(30).required()
    });

    const validate = schema.validate({ id });

    // Use the previous function as a prerequisite to get the destination data
    if (id >= 0 && id < result.length && validate.error) {
        const { Latitude, Longitude } = result[id]; // Destructure latitude and longitude
        if (Latitude && Longitude) {
            res.send({ Latitude, Longitude });
        } else {
            res.status(404).send({ error: "Coordinates not found for this destination" });
        }
    } else {
        res.status(404).send(`Destination not found ${validate.error}`);
    }
});

// Define the API endpoint to retrieve data by row index (Destination ID)
router.get('/destinations/:id', (req, res) => {
    const id = parseInt(req.params.id, 10); // Convert id to an integer
    
    // Define a schema to validate the id parameter
    let schema = joi.object({
        id: joi.number().integer().min(0).required()
    });
    // Validate the id parameter
    const validate = schema.validate({ id });

    // Check if the id is within the valid range of the result array
    if ((id >= 0 && id < result.length) && !validate.error) {
        const destination = result[id]; // Access the destination by index
        res.send(destination);
    } else {
        res.status(404).send(`Destination not found ${validate.error}`);
    }
});

//Define a router for the API endpoints
app.use('/api', router);

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})