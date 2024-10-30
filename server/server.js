
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;
const csvparser = require('csv-parser');
const router = express.Router();
const joi = require('joi');

//Setup serving front-end code
app.use('/', express.static('../client'));

app.use((req, res, next) => {
    console.log(`${req.method} Request: ${req.url}`);
    next();
});

app.get('/api/', (req, res) => {
    res.send('Hello World!');
});

//Setup serving data
const result = [];

fs.createReadStream("./data/europe-destinations.csv")
    .pipe(csvparser())
    .on("data", (data) => {
        result.push(data);
    })
    .on("end", () => {
        console.log(`Successfully read ${result.length} destinations`);
  });
// had to put the code above /:id otherwise it would think it would be reading the country as an id
// Define the API endpoint to retrieve data by country of the destination
router.get('/countries', (req,res) => {
    // Extract unique country names from the result array
    const countries = [...new Set(result.map(destination => destination.Country))];
    res.send(countries);
});

// Define the API endpoint to retrieve data by row index (Destination ID)
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10); // Convert id to an integer
    console.log(`Requested row index: ${id}`);
    
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
router.get('/:id/location', (req, res) => {
    const id = parseInt(req.params.id, 10); // Convert id to an integer
    console.log(`Requested row index: ${id}`);

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

router.get('/search', (req, res) => {
    const { field, pattern, n } = req.query; // Extract query parameters
    const limit = n ? parseInt(n, 10) : null; // Convert n to an integer or default to 5

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
})



});


app.get(':id/')
//Define a router for the API endpoints
app.use('/api/destinations', router);


app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})