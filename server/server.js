const express = require('express');
const app = express();
const port = 3000;

//Setup serving front-end code
app.use('/', express.static('../client'));

app.get('/api/', (req, res) => {
    res.send('Hello World then nae');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})