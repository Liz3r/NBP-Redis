import { useContext, useEffect } from "react";
import { appContext } from "./App";
import { socket } from "./Socket";


function Lobby(){

    const { state, setState } = useContext(appContext);

    const emitMessage = () => {
        socket.emit('event', state.player, state.channel);
    }
   
    return(
        <div className="lobby-div">
            <h3>Waiting for players...</h3>
            <div className="lobby-players-div">
                <button onClick={emitMessage}>click</button>
            </div>
            
        </div>
    );
}


export default Lobby;