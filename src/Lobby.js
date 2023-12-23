import { useContext } from "react";
import { appContext } from "./App";


function Lobby(){

    const { state, setState } = useContext(appContext);

    return(
        <div className="lobby-div">
            <div>
                {state.channel}
            </div>
        </div>
    );
}


export default Lobby;