const express = require("express");
const redis = require("redis");
const http = require("http");
const Server = require("socket.io");
const cors = require("cors");

const app = express();
const port = 3001;

const server = http.createServer(app);
const io = Server(server);

const cli = redis.createClient();
cli.connect();


app.use(cors());
app.use(express.json());

app.get('/',(req,res) => {
    res.send("root");
})

io.on('connect', (socket) =>{
    console.log("User connected");
    io.on('disconnect',() => {
        console.log("User disconnected");
    })
})

app.post("/createChannel/:channel/:username", async (req,res) => {
    let channel_name = req.params.channel;
    let player_name = req.params.username;

    console.log(channel_name,player_name);
    let ret = await cli.get("activeChannels",(err,reply) => {
        console.log(reply);
        if(!reply){
            console.log("aa");
        }
    });

    console.log(ret);
    
    res.status(200).send({message: "success"});
})

app.listen(port, () => {
    console.log(`Listening on ${port}`);
})