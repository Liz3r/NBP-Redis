import React, { useContext, useEffect, useState, useRef } from "react";
import { appContext } from "./App";
import { socket } from "./Socket";


function Player({gameState, setGameState}){
    
    const cards = gameState.cards;
    const cardsList = (cards != 0)? cards.map((card,index) =>
        <div id="card" className={`${card.charAt(0)} num${card.charAt(1)}`} value={card} key={index}></div>
    ) : <></>;
    return (
        <div>
            {cardsList}
        </div>
    );
}


function Game(){

    const { state, setState } = useContext(appContext);

    const [ isConnected, setIsConnected] = useState(socket.connected);

    //game state
    const [ gameStarted, setGameStarted ] = useState(false);
    const [ isReady, setIsReady ] = useState(false);
    const [ gameState, setGameState] = useState({cards: [], tableCard: '', playerCardNum: 0, opponentCardNum: 0, myTurn: false});    

    useEffect(() => {

        function onMessage(objectMessage){
            //console.log(objectMessage);
            
            switch(objectMessage.message){
                case "start":
                    console.log("game has started");
                    fetch(`http://localhost:3001/getPlayerState/${state.channel}/${state.player}`,{
                        method: 'GET'
                    }).then(res=> {
                        if(res.status === 200){
                            return res.json();
                        }
                    }).then(data => {
                        console.log(data);
                        setGameState(data);
                    }).catch(err => {
                        console.log("Error: " + err);
                    })
                    break;

                default:
                    console.log("unknown signal");
                    break;
            }
        }

        function onConnect(){
            socket.emit('subscribe', state.player, state.channel);
            setIsConnected(true);
        }

        function onDisconect(){
            setIsConnected(false);
        }
        
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconect);
        socket.on('newmessage', onMessage);


        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconect);
            socket.off('newmessage',onMessage);
        }
    }, [])
   
    function Ready(){

        fetch(`http://localhost:3001/playerReady/${state.channel}/${state.player}`, {
            method: "POST"
        })
        .then(res => {
            if(res.status === 200){
                sessionStorage.setItem("ready",true);
                setIsReady(true);
            }
        });
    }

    return(
        <div className="game-div">
            <div className="opponent-div">

            </div>
            
            <div className="player-div">
                {(isReady == true)? <Player gameState={gameState} setGameState={(state) => setGameState(state)}/>:<button onClick={() => {Ready()}}>Ready</button>}
            </div>
        </div>
    );
}


export default Game;