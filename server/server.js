const express = require("express");
const redis = require("redis");
const cors = require("cors");
const io = require("socket.io")(4000, {
    cors: {
        origin: ["http://localhost:3000"]
    }
});

io.on('connection', (socket) =>{
    console.log("connected: " + socket.id);
    socket.on('disconnect', () => {
        console.log("disconnected: " + socket.id);
    })
    socket.on('event', (player, channel) => {
        console.log(`new connection: ${player} , ${channel}`);
    });
})



const app = express();
const port = 3001;


const cli = redis.createClient();
cli.connect();


app.use(cors());
app.use(express.json());



app.post("/createChannel/:channel/:username", async (req,res) => {
    let channel_name = req.params.channel;
    let player_name = req.params.username;

    let ret = await cli.sIsMember("AllChannels", channel_name, (err, reply) => { 
        if(err){
            res.status(400).send({error: err});
        }
    });
    
    if(!ret){

        //dodavanje novog kanala u listu aktivnih kanala
        let result = await cli.sAdd("AllChannels",channel_name, (err, reply) => { 
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
            res.status(200).send({
                success: true,
                message: "User added to new channel."
            });
        }
    }else{
        res.status(200).send({
            success: false,
            message: "Channel already exists."
        });
    }
    
})

app.post("/joinChannel/:channel/:username", async (req,res) => {
    const channel_name = req.params.channel;
    const player_name = req.params.username;

    let isMemberAll = await cli.sIsMember("AllChannels", channel_name);

    if(!isMemberAll){
        res.status(200).send({
            success: false,
            message: `Channel ${channel_name} does not exist.`
        });
        return;
    }

    let isMemberStarted = await cli.sIsMember("StartedChannels", channel_name);
    if(isMemberStarted){
        res.status(200).send({
            success: false,
            message: `Game has already started on channel "${channel_name}".`
        });
        return;
    }

    let nameInChannel = await cli.sIsMember(channel_name, player_name);
    if(nameInChannel){
        res.status(200).send({
            success: false,
            message: `Player with that name is already present in channel "${channel_name}".`
        });
        return;
    }

    let numPlayers = await cli.sCard(channel);
    if(numPlayers >= 2){
        res.status(200).send({
            success: false,
            message: `Channel is full (max players: 2).`
        });
        return;
    }

    let addUser = await cli.sAdd(channel_name, player_name, (err, reply) => { 
        if(err){
            res.status(400).send({error: err});
            return;
        }
    });


    res.status(200).send({
        success: true,
        message: "User has joined the channel"
    });
    return;
})

app.listen(port, () => {
    console.log(`Listening on ${port}`);
})