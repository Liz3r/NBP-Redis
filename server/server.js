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
    'rp', 'gp', 'yp', 'bp',
    'rs', 'gs', 'ys', 'bs' ];

    // r - red, b - blue, y - yellow, g - green
    // p -  +2
    // s - skip

function generateCard(){
    //let res = '';
    let num = (Math.round(Math.random()*100)) % 44;
    let res = cards[num];
    return res;
}

app.post('/playerReady/:channel/:player', async (req,res) => {
    const channel = req.params.channel;
    const player = req.params.player;

    await cli.sAdd(`${channel}:ready`,player);
    
    const players = await cli.sMembers(`${channel}:ready`);
    console.log(players);
    if(players.length > 1){

        //console.log(players);
        let generatedTableCard = generateCard();
        //igrac koji nije na potezu
        (((Math.round(Math.random() * 10)) % 2) == 0)? await cli.set(`turn:${channel}`, players[0]) : await cli.set(`turn:${channel}`, players[1]);
        //karta na stolu
        await cli.set(`tableCard:${channel}`,generatedTableCard);

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

        await cli.rename(`${channel}:ready`,`${channel}:started`);
        
        await cli.publish(channel,JSON.stringify({message: "start"}));


    }

    res.status(200).send();
})

app.get('/getPlayerState/:channel/:player', async (req, res) => {
    const channel = req.params.channel;
    const player = req.params.player;

    const players = await cli.sMembers(`${channel}:started`);
    const opponent = (players[0] == player)? players[1] : players[0];
    //trebalo bi da se doda mehanizam za autentifikaciju
    const getHand = await cli.lRange(`cards:${player}:${channel}`,0,-1);
    const getTableCard = await cli.get(`tableCard:${channel}`);
    const getPlayerCardNum = getHand.length;
    const getOpponentCardNum = await cli.lLen(`cards:${opponent}:${channel}`);
    const playerTurn = (await cli.get(`turn:${channel}`) != player);
    //console.log(getTurnList);
    
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

app.post('/drawCard/:channel/:player', async (req,res) => {
    const channel = req.params.channel;
    const player = req.params.player;

    const getTurn = await cli.get(`turn:${channel}`);
    if(getTurn[0] == player){
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
    await cli.set(`turn:${channel}`,player);
    await cli.set(`draw:${channel}:number`, "1");

    await cli.publish(channel,JSON.stringify({message: "draw", player: player}));

    res.status(200).send({
        success: true,
        message: "draw succeded",
        addCards: newCards
    });

})

app.post('/play/:channel/:player/:card', async (req,res) => {
    const player = req.params.player;
    const channel = req.params.channel;
    const card = req.params.card;

    const notTurn = await cli.get(`turn:${channel}`);
    if(notTurn == player){
        res.status(200).send({
            success: false,
            message: "opponent's turn"
        });
        return;
    }

    const playerCardColor = card.charAt(0);
    const playerCardSign = card.charAt(1);

    const tableCard = await cli.get(`tableCard:${channel}`);

    const tableCardColor = tableCard.charAt(0);
    const tableCardSign = tableCard.charAt(1);

    //------------------------na dalje treba da se proveri
    const drawMultipleCardsNum = await cli.get(`draw:${channel}:number`);
    if(parseInt(drawMultipleCardsNum) > 1){
        if(playerCardSign == "p"){
            //play card
            await cli.lRem(`cards:${player}:${channel}`, 1, card);
            await cli.set(`turn:${channel}`, player);
            await cli.incrBy(`draw:${channel}:number`, 2);
            await cli.set(`tableCard:${channel}`, card);
            await cli.publish(channel,JSON.stringify({message: "played", player: player}));
            res.status(200).send({
                success: true,
                message: "played card",
                myTurn: false,
                tableCard: card
            });
            return;
        }else{
            res.status(200).send({
                success: false,
                message: "Invalid move"
            });
            return;
        }
    }

    if(playerCardSign == tableCardSign){

        let turn = false;
        //ukloni kartu igracu
        await cli.lRem(`cards:${player}:${channel}`, 1, card);
        
        if(playerCardSign != "s"){
            //ako karta nije skip onda se menja potez (u suprotnom opet igra isti igrac)
            await cli.set(`turn:${channel}`, player);
            turn = true;
        }
        //zamena poteza obradjena

        if(playerCardSign == "p"){
            //za slucaj da je karta +2
            await cli.incrBy(`draw:${channel}:number`, 2);
        }

        //zamena karte na stolu
        await cli.set(`tableCard:${channel}`, card);

        await cli.publish(channel,JSON.stringify({message: "played", player: player}));
        res.status(200).send({
            success: true,
            message: "played card",
            myTurn: turn,
            tableCard: card
        });

    }else if(playerCardColor == tableCardColor){
        await cli.lRem(`cards:${player}:${channel}`, 1, card);
        await cli.set(`turn:${channel}`, player);
        await cli.set(`tableCard:${channel}`, card);
        await cli.publish(channel,JSON.stringify({message: "played", player: player}));
        res.status(200).send({
            success: true,
            message: "played card",
            myTurn: false,
            tableCard: card
        });
        return;
    }else{
        res.status(200).send({
            success: false,
            message: "Invalid move"
        });
        return;
    }
})

app.listen(port, () => {
    console.log(`Listening on ${port}`);
})