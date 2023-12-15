const express = require("express");
const redis = require("redis");

const app = express();
const port = 3001;

let client_id = 0;
let subClients = [];
let pubClients = [];

app.get('/',(req,res) => {

    res.send("root");

})

app.listen(port, () => {
    console.log(`Listening on ${port}`);
})