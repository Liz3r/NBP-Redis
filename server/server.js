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

    let ret = await cli.sMembers("ActiveChannels", (err, reply) => { 
        if(err){
            res.status(400).send({error: err});
        }
    });

    if(!ret.includes(channel_name)){


        //dodavanje novog kanala u listu aktivnih kanala
        let result = await cli.sAdd("ActiveChannels",channel_name, (err, reply) => { 
            if(err){
                res.status(400).send({error: err});
            }
        });
        //dodavanje korisnika u kanal
        let result2 = await cli.sAdd(channel_name,player_name, (err, reply) => { 
            if(err){
                res.status(400).send({error: err});
            }
        });
        if(result == 1 && result2 == 1){
            res.status(200).send({message: "User added to new channel."});
        }

    }else{

        res.status(200).send({message: "Channel already exists."});
    }
    
})

app.listen(port, () => {
    console.log(`Listening on ${port}`);
})