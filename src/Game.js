import { useContext, useEffect } from "react";
import { appContext } from "./App";
import { socket } from "./Socket";


function Game(){

    const { state, setState } = useContext(appContext);


    useEffect(() => {

        function onMessage(message){
            console.log(message);
        }
        
        


        socket.emit('subscribe', state.player, state.channel);

        

        socket.on('newmessage', onMessage);


        return () => {
            socket.off('newmessage',onmessage);
        }
    }, [])
   
    return(
        <div className="game-div">
            <div className="player-div">

            </div>

            <div className="player-div">

            </div>
        </div>
    );
}


export default Game;