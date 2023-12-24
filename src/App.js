import { useState, useRef, useContext, createContext, useEffect, useLayoutEffect} from 'react';
import './App.css';
import { socket } from './Socket';
import Lobby from './Lobby';



const redis = require('redis');

export const appContext = createContext(null);
export const socketContext = createContext(null);


function Menu(){

  const [errorMsg,setErrorMsg] = useState('');

  const { state, setState } = useContext(appContext);

  const usernameInputRef = useRef(null);
  const channelInputRef = useRef(null);

  
  const createChannel = () => {
    const channel = channelInputRef.current.value;
    const player = usernameInputRef.current.value;
    fetch(`http://localhost:3001/createChannel/${channel}/${player}`,{
      method: "POST"
    }).then(res => {
      return res.json();
    }).then(data => {
      if(data.success == true){
        console.log(data.message);
        setErrorMsg('');
        //promeni app state i prikazi lobby komponentu
        setState({show: 'lobby',channel: channel});
        // const sub = redis.createClient();
        // sub.subscribe()
      }else{
        setErrorMsg(data.message);
      }
    }).catch(err => {
      console.log("Error: " + err);
    });
  }

  const joinChannel = () => {
    const channel = channelInputRef.current.value;
    const player = usernameInputRef.current.value;
    fetch(`http://localhost:3001/joinChannel/${channel}/${player}`,{
      method: "POST"
    }).then(res => {
      return res.json();
    }).then(data => {
      if(data.success == true){
        console.log(data.message);
        setErrorMsg('');
        //promeni app state i prikazi lobby komponentu
        setState({show: 'lobby',channel: channel});
        
      }else{
        setErrorMsg(data.message);
      }
    }).catch(err => {
      console.log("Error: " + err);
    });
  }

  return(
    <div className='menu-div'>

      <div>
        <p>Username</p>
        <input
          ref={usernameInputRef}
        ></input>
        <p>Channel name</p>
        <input
          ref={channelInputRef}
        ></input>
      </div>

      <div className='menu-buttons-div'>
      <button onClick={createChannel}>
        Create channel
      </button>
      <button onClick={joinChannel}>
        Join channel
      </button>
      </div>
      <div className='err-div'>{errorMsg}</div>
    </div>
  );
}

function App() {
  
  const [state, setState] = useState({show: 'menu', channel: ''});
  //socket state
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    checkStorage();
    
    function onConnect(){
      socket.setIsConnected(true);
    }

    function onDisconnect(){
      socket.setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect',onConnect);
      socket.off('disconnect',onDisconnect);
    }

  }, []);

  const checkStorage = () =>{
    let showSS = sessionStorage.getItem("show");
    let channelSS = sessionStorage.getItem("channel");
    if(showSS){
      setState({show: showSS, channel: channelSS});
    }
  }

  return (
    <appContext.Provider value = {{state: state, setState: (newState) => {
      sessionStorage.setItem("show", newState.show);
      sessionStorage.setItem("channel", newState.channel);
      setState(newState);
      }}}>
        <socketContext.Provider value= {{isConnected: isConnected}}>
      {
        (state.show == 'menu')? <Menu/> : (state.show == 'lobby')? <Lobby/> : <></> //: (state.show == 'game')
      }
      </socketContext.Provider>
    </appContext.Provider>
  );
}

export default App;
