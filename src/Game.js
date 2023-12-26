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
    const [ isReady, setIsReady ] = useState({player: false, oponnent: false});

    const [ myTurn, setMyTurn ] = useState(null);
    const [ playerCards, setPlayerCards] = useState({cards: [], count: 0});

    
    

    useEffect(() => {

        function onMessage(message){
            console.log(message);
            
        }
        
        function onConnect(){
            socket.emit('subscribe', state.player, state.channel);
            setIsConnected(true);
        }

        function onDisconect(){
            setIsConnected(false);
        }

        function onReady(){

        }


        

        

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconect);
        socket.on('newmessage', onMessage);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconect);
            socket.off('newmessage',onMessage);
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