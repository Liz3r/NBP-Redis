import React, { useContext, useEffect, useState, useRef } from "react";
import { appContext } from "./App";
import { socket } from "./Socket";


function Player({gameState, setGameState}){
    

    //const cardsRefList = useRef([]);
    const { state, setState } = useContext(appContext);

    //kriticna sekcija sto bi se reklo
    function playCard(cardValue, index){
        console.log("Playing: " + cardValue);
        if(gameState.myTurn === true){
            fetch(`http://localhost:3001/play/${state.channel}/${state.player}/${cardValue}`,{
                method: 'POST'
            }).then(res => {
                if(res.status === 200){
                    return res.json();
                }
            }).then(data => {
                if(data.success === true){
                    //const newState = {...gameState}
                    //skine sebi jednu kartu + animacija ako je moguce
                    // newState.tableCard = data.tableCard;
                    // newState.myTurn = data.myTurn;
                    // newState.playerCardNum = newState.playCardNum - 1;
                    // newState.cards = newState.cards.splice(index,1);

                    fetch(`http://localhost:3001/getPlayerState/${state.channel}/${state.player}`,{
                        method: 'GET'
                    }).then(res=> {
                        if(res.status === 200){
                            return res.json();
                        }
                    }).then(data => {
                        setGameState(data);
                    }).catch(err => {
                        console.log("Error: " + err);
                    })

                    //setGameState(newState);
                }
            }).catch(err => {
                console.log("error: " + err);
            })
        }
    }
    //------------------------------------------------------
    const cards = gameState.cards;
    const cardsList = (cards != 0)? cards.map((card,index) =>
        (card.charAt(1) != "s" && card.charAt(1) != "p")?
        <div id="card" className={`${card.charAt(0)} num${card.charAt(1)}`} key={index} onClick={() => playCard(card,index)}></div>
        : <div id="card" className={`spec${card.charAt(0)} spec${card.charAt(1)}`} key={index} onClick={() => playCard(card)}></div>
    ) : <></>;
    return (
        <div className="cards-div">
            {cardsList}
        </div>
    );
}

function Opponenet({gameState, setGameState}){

    const opponentCards = [];
    for(let i = 0; i < gameState.opponentCardNum; i++){
        opponentCards.push(<div className="opponent-card" key={i}></div>)
    }
    return(
        <div className="cards-div">
            {opponentCards}
        </div>
    );
}

function Game(){

    const { state, setState } = useContext(appContext);

    const [ isConnected, setIsConnected] = useState(socket.connected);

    //game state
    const [ isReady, setIsReady ] = useState(false);
    const [ gameState, setGameState] = useState({cards: [], tableCard: '', playerCardNum: 0, opponentCardNum: 0, myTurn: false, gameStarted: false});    
    console.log("new change of state:");
    console.log(gameState);
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
                        sessionStorage.setItem("gameStarted",true);
                        setGameState(data);
                    }).catch(err => {
                        console.log("Error: " + err);
                    })
                    break;
                
                case "draw":
                    if(objectMessage.player != state.player){

                        fetch(`http://localhost:3001/getPlayerState/${state.channel}/${state.player}`,{
                            method: 'GET'
                        }).then(res=> {
                            if(res.status === 200){
                                return res.json();
                            }   
                        }).then(data => {
                            setGameState(data);
                        }).catch(err => {
                            console.log("Error: " + err);
                        })
                        
                    }
                    break;
                case "played":
                    if(objectMessage.player != state.player){
                        fetch(`http://localhost:3001/getPlayerState/${state.channel}/${state.player}`,{
                            method: 'GET'
                        }).then(res=> {
                            if(res.status === 200){
                                return res.json();
                            }   
                        }).then(data => {
                            setGameState(data);
                        }).catch(err => {
                            console.log("Error: " + err);
                        })
                        
                    }
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
                setIsReady(true);
            }
        });
    }

    function drawCard(){
        if(gameState.myTurn === true){
            fetch(`http://localhost:3001/drawCard/${state.channel}/${state.player}`,{
                method: 'POST'
            }).then(res => {
                if(res.status === 200){
                    return res.json();
                }
            }).then(data => {
                if(data.success === true){
                    const newState = {...gameState}
                    
                    newState.cards.push(...data.addCards);
                    newState.myTurn = false;
                    console.log(newState);
                    setGameState(newState);
                    //animacija
                }
            }).catch(err => {
                console.log("error: " + err);
            })
        }
    }

    return(
        <div className="game-div">
            <div className="opponent-div">
                <Opponenet gameState={gameState} setGameState={(state) => setGameState(state)}/>
            </div>

            {(gameState.gameStarted)? <div className="mid-div">
                <div className="deck-card" onClick={drawCard}></div>
                {(gameState.tableCard.charAt(1) != "s" && gameState.tableCard.charAt(1) != "p")?
                    <div id="card" className={`${gameState.tableCard.charAt(0)} num${gameState.tableCard.charAt(1)} table-card`}></div>
                :   <div id="card" className={`spec${gameState.tableCard.charAt(0)} spec${gameState.tableCard.charAt(1)} table-card`}></div>
                }
            </div>
            :
            <></>
            }
            
            
            <div className="player-div">
                {(isReady == true)? <Player gameState={gameState} setGameState={(state) => setGameState(state)}/>:<button onClick={() => {Ready()}}>Ready</button>}
            </div>
        </div>
    );
}


export default Game;