const express = require("express");
const redis = require("redis");
const cors = require("cors");
const io = require("socket.io")(4000, {
    cors: {
        origin: ["http://localhost:3000"]
    }
});

io.on('connection', (socket) =>{

    console.log("The number of connected sockets: " + socket.adapter.sids.size);
    //connect redis subscriber
    var sub = redis.createClient();
    sub.connect();

    console.log("connected: " + socket.id);

    //disconnect
    socket.on('disconnect', () => {
        sub.quit();
        console.log("disconnected: " + socket.id);
    });

    socket.on('subscribe', (player, channel_room) => {

        if(player && channel_room){

            socket.join(channel_room);

            //listener se prosledjuje u subscribe funkciji (iako u dokumentaciji pise da se prosledjuje .on() funkciji)
            sub.subscribe(channel_room, (message) => {
                const poruka = JSON.parse(message);
                console.log(message);
                socket.broadcast.to(channel_room).emit("newmessage", poruka);
            });

        }else{
            console.log("wrong parameters");
        }
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

    let numPlayers = await cli.sCard(channel_name);
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

//-----------------------------------------game-----------


const cards = [
    'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9',
    'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9',
    'y1', 'y2', 'y3', 'y4', 'y5', 'y6', 'y7', 'y8', 'y9',
    'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9',
    's1', 's2' ];

function generateCard(){
    //let res = '';
    let num = (Math.round(Math.random()*100)) % 38;
    let res = cards[num];
    return res;
}

app.post('/playerReady/:channel/:player', async (req,res) => {
    const channel = req.params.channel;
    const player = req.params.player;

    await cli.sAdd(`${channel}:ready`,player);
    const readyCount = await cli.sCard(`${channel}:ready`);
    console.log(readyCount);
    if(readyCount > 1){
        const players = await cli.sMembers(`${channel}:ready`);
        
        let generatedTableCard = generateCard();
        let firstTurnPlayerIndex = (Math.round(Math.random() * 10)) % 2;
        //karta na stolu
        await cli.set(`tableCard:${channel}`,generatedTableCard);
        //lista igraca [player1, player2]  (prvi u listi je na potezu pa se rotira lista)
        (firstTurnPlayerIndex == 0)? await cli.rPush(`turn:${channel}`, players[0], players[1]) : await cli.rPush(`turn:${channel}`, players[1], players[0]);

        players.forEach(async (player) => {

            let hand = [];
            for(let i = 0; i < 6; i++){
                hand.push(generateCard());
            }
            //current player cards | pribavljanje duzine liste pomocu LLEN ime_liste
            await cli.rPush(`cards:${player}:${channel}`, hand);

        });

        //ako se na tabli nadju +2 / +4 karte stekuju se dok neko ne pokrene izvlacenje novih karata (nakon toga se stek vraca na 1 kartu po izvlacenju)
        await cli.incr(`draw:${channel}:number`);

        await cli.publish(channel,JSON.stringify({message: "start"}));
        await cli.del(`${channel}:ready`);


    }

    res.status(200).send();
})

app.get('/getPlayerState/:channel/:player', async (req, res) => {
    const channel = req.params.channel;
    const player = req.params.player;

    let getTurnList = await cli.lRange(`turn:${channel}`,0,-1);
    const opponent = (getTurnList[0] == player)? getTurnList[1] : getTurnList[0];
    //trebalo bi da se doda mehanizam za autentifikaciju
    let getHand = await cli.lRange(`cards:${player}:${channel}`,0,-1);
    let getTableCard = await cli.get(`tableCard:${channel}`);
    let getPlayerCardNum = getHand.length;
    //await cli.lLen(`cards:${player}:${channel}`);
    let getOpponentCardNum = await cli.lLen(`cards:${opponent}:${channel}`);
    let playerTurn = (getTurnList[0] == player);

    

    const data = {
        cards: getHand,
        tableCard: getTableCard,
        playerCardNum: getPlayerCardNum,
        opponentCardNum: getOpponentCardNum,
        myTurn: playerTurn,
        gameStarted: true
    }

    console.log(data);
    res.status(200).send(data);
})

app.post('/play/:channel/:player/:card', (req,res) => {

})

app.post('/drawCard/:channel/:player', async (req,res) => {
    const channel = req.params.channel;
    const player = req.params.player;

    const getTurn = await cli.lRange(`turn:${channel}`,0,-1);
    if(getTurn[0] != player){
        res.status(200).send({
            success: false,
            message: "opponent's turn"
        });
        return;
    }

    const howMany = await cli.get(`draw:${channel}:number`);

    const newCards = [];
    for(let i = 0; i < howMany; i++){
        newCards.push(generateCard());
    }
    await cli.rPush(`cards:${player}:${channel}`, newCards);
    await cli.lPop(`turn:${channel}`);
    await cli.rPush(`turn:${channel}`, player);

    await cli.publish(channel,JSON.stringify({message: "draw", player: player, count: howMany}));

    res.status(200).send({
        success: true,
        message: "draw succeded",
        addCards: newCards
    });

})


app.listen(port, () => {
    console.log(`Listening on ${port}`);
})