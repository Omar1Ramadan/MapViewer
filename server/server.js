const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;
const csvparser = require('csv-parser');
const router = express.Router();
const joi = require('joi');

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
const result = [];
const lists = {};

fs.createReadStream("./data/europe-destinations.csv")
    .pipe(csvparser())
    .on("data", (data) => {
        result.push(data);
    })
    .on("end", () => {
        console.log(`Successfully read ${result.length} destinations`);
  });

// any route with the list parameters

// Route for creating and retrieving lists
router.route('/list')
    .post((req, res) => {
        const { listName } = req.body;

        // Schema validation
        const schema = joi.object({
            listName: joi.string().required()
        });

        const { error } = schema.validate({ listName });
        if (error) {
            return res.status(400).send({ error: error.details[0].message });
        }

        // Check if list already exists
        if (lists[listName]) {
            return res.status(400).send({ error: `List '${listName}' already exists` });
        }

        // Create the list
        lists[listName] = [];
        res.status(201).send({ message: `List '${listName}' created successfully` });
    })
    .get((req, res) => {
        res.send(lists);
    });

// Route to retrieve a specific list by name
router.get('/list/:listName', (req, res) => {
    const { listName } = req.params;

    // Check if list exists
    if (!lists[listName]) {
        return res.status(404).send({ error: `List '${listName}' not found` });
    }

    // Return the list
    res.send({ listName, destinations: lists[listName] });
});


router.get('/search', (req, res) => {
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

    // Return the first n matches or all matches if n is not provided
    const limitedFilter = limit ? filter.slice(0, limit) : filter;
    res.send(limitedFilter);

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

    console.log(validate);
    // Check if the id is within the valid range of the result array
    if ((id >= 0 && id < result.length) && !validate.error) {
        const destination = result[id]; // Access the destination by index
        console.log(destination);
        res.send(destination);
    } else {
        res.status(404).send(`Destination not found ${validate.error}`);
    }
});

// Define the API endpoint to retrieve data by location of the destination
router.get('/destinations/:id/location', (req, res) => {
    const id = parseInt(req.params.id, 10); // Convert id to an integer
    

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


//Define a router for the API endpoints
app.use('/api', router);

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})