import React, { useContext, useEffect, useState, useRef } from "react";
import { appContext } from "./App";
import { socket } from "./Socket";


function Player(){
    
    return (
        <div>komponenta</div>
    );
}


function Game(){

    const { state, setState } = useContext(appContext);

    const [ isConnected, setIsConnected] = useState(socket.connected);

    //game state
    const [ gameStarted, setGameStarted ] = useState(false);
    const [ myTurn, setMyTurn ] = useState(null);
    const [ playerCards, setPlayerCards] = useState({cards: [], count: 0});
    
    

    useEffect(() => {

        function onMessage(message){
            console.log(message);
        }
        
        function onConnect(){
            setIsConnected(true);
        }

        function onDisconect(){
            setIsConnected(false);
        }


        socket.emit('subscribe', state.player, state.channel);

        

        socket.on('newmessage', onMessage);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconect);

        return () => {
            socket.off('newmessage',onmessage);
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconect);
        }
    }, [])
   
    return(
        <div className="game-div">
            <div className="opponent-div">

            </div>
            
            <div className="player-div">
                <Player></Player>
            </div>
        </div>
    );
}


export default Game;