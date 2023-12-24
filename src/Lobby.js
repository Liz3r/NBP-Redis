import { useContext, useEffect } from "react";
import { appContext } from "./App";


function Lobby(){

    const { state, setState } = useContext(appContext);

   
    return(
        <div className="lobby-div">
            <h3>Waiting for players...</h3>
            <div className="lobby-players-div"></div>
        </div>
    );
}


export default Lobby;