const express = require("express");
const redis = require("redis");
const http = require("http");
const Server = require("socket.io");

const app = express();
const port = 3001;

const server = http.createServer(app);
const io = Server(server);

const cli = redis.createClient();
cli.connect();

app.get('/',(req,res) => {
    res.send("root");
})

io.on('connect', (socket) =>{
    console.log("User connected");
    io.on('disconnect',() => {
        console.log("User disconnected");
    })
})

app.post("/createChannel", (req,res) => {
    //let channel_name = req.body.channelName;
    //let player_name = req.body.playerName;

    let ret = cli.get("activeChannels",(err,reply) => {
        console.log(reply);
    });

    //console.log(ret);

    res.status(200).send({message: ret});
})

app.listen(port, () => {
    console.log(`Listening on ${port}`);
})