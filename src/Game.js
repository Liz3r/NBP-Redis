import React, { useContext, useEffect, useState, useRef, createElement } from "react";
import { appContext } from "./App";
import { socket } from "./Socket";

function Player({props}){
    

    const { state, setState, gameState, setGameState } = props;

    function playCard(cardValue){
        if(gameState.myTurn === true){
            fetch(`http://localhost:3001/play/${state.channel}/${state.player}/${cardValue}`,{
                method: 'POST'
            }).then(res => {
                if(res.status === 200){
                    return res.json();
                }
            }).then(data => {
                //console.log("Playing: " + cardValue);
                if(data.success === true){

                    fetch(`http://localhost:3001/getPlayerState/${state.channel}/${state.player}`,{
                        method: 'GET'
                    }).then(res=> {
                        if(res.status === 200){
                            return res.json();
                        }
                    }).then(gameData => {
                        setGameState(gameData);
                    }).catch(err => {
                        console.log("Error: " + err);
                    })
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
        <div id="card" className={`${card.charAt(0)} num${card.charAt(1)}`} key={index} onClick={() => playCard(card)}></div>
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

function Game({props}){

    const { state, setState } = props;

    const [ isConnected, setIsConnected] = useState(socket.connected);
    const [ gameOver, setGameOver ] = useState({gameOver: false, message: ''});
    const [ gameState, setGameState] = useState({cards: [], tableCard: '', playerCardNum: 0, opponentCardNum: 0, myTurn: false});

    useEffect(() => {
        if(state.gameStarted == true){
            console.log("Render child (<Game/>)")
            console.log(state.gameStarted);
            fetch(`http://localhost:3001/getPlayerState/${state.channel}/${state.player}`,{
                        method: 'GET'
                    }).then(res=> {
                        if(res.status === 200){
                            return res.json();
                        }
                    }).then(data => {
                        //console.log("fetched data");
                        console.log(data);
                        setGameState(data);
                        
                    }).catch(err => {
                        console.log("Error: " + err);
                    })
        }
        return;
    },[state])

    useEffect(() => {

        function onMessage(objectMessage){

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
                        const currentState = {...state};
                        currentState.gameStarted = true;
                        //console.log()
                        setState(currentState);
                        setGameState(data);
                    }).catch(err => {
                        console.log("Error: " + err);
                    })
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
                case "finish":
                    console.log("game over");
                    fetch(`http://localhost:3001/finishGame/${state.channel}/${state.player}`, {
                        method: "POST"
                    }).then(res=> {
                        if(res.status === 200){
                            if(state.player == objectMessage.winner){
                                setGameOver({gameOver: true, message: "YOU WON"});
                            }else{
                                setGameOver({gameOver: true, message: "YOU LOST"});
                            }
                        }   
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
   
    function Ready(target){

        fetch(`http://localhost:3001/playerReady/${state.channel}/${state.player}`, {
            method: "POST"
        })
        .then(res => {
            if(res.status === 200){
                //setIsReady(true);
                sessionStorage.setItem("isReady",true);
                const currentState = {...state};
                state.isReady = true;
                target.disabled = true;
                target.innerHTML = "Waiting for opponent";
                setState(currentState);
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
            }).catch(err => {
                console.log("error: " + err);
            })
        }
    }

    function Leave(){
        sessionStorage.clear();
        setGameOver({gameOver: false, message: ''});
        setGameState({cards: [], tableCard: '', playerCardNum: 0, opponentCardNum: 0, myTurn: false});
        setState({show: 'menu', channel: '', player: '', isReady: false, gameStarted: false});
    }

    return(
        
        <div className="game-div">
            
            <div className="opponent-div">
                <Opponenet gameState={gameState} setGameState={(state) => setGameState(state)}/>
            </div>

            {(state.gameStarted)? <div className="mid-div">
                <div className="deck-card" onClick={drawCard}></div>

                {(gameState.tableCard.charAt(1) != "s" && gameState.tableCard.charAt(1) != "p")?
                    <div id="card" className={`${gameState.tableCard.charAt(0)} num${gameState.tableCard.charAt(1)} table-card`}></div>
                :   <div id="card" className={`spec${gameState.tableCard.charAt(0)} spec${gameState.tableCard.charAt(1)} table-card`}></div>}

                <h1 className="player-opponent-turn-text">{(gameState.myTurn)? "YOUR TURN": "OPPONENT'S TURN"}</h1>
            </div> : <></>}
        
            <div className="player-div">
                {(state.isReady == true)? <Player props={{state: state, setState: (state) => {setState(state)}, gameState:gameState, setGameState: (state) => {setGameState(state)}}}/>:<button className="ready-button" onClick={(event) => {Ready(event.currentTarget)}}>Start game</button>}
            </div>
    
            {(gameOver.gameOver)? 
            <div className="gameOver-div">
            <div className="gameOver-menu-div">
                <h1>GAME OVER</h1>
                <h2>{gameOver.message}</h2>
                <button className="leave-button" onClick={Leave}>Leave</button>
            </div>
        </div>
        : <></>}
        </div>
    );
}


export default Game;