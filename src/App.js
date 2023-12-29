import { useState, useRef, useContext, createContext, useEffect, useLayoutEffect} from 'react';
import './App.css';
import Game from './Game';



export const appContext = createContext(null);


function Menu({props}){

  const [errorMsg,setErrorMsg] = useState('');

  const { state, setState } = props;

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
        //promeni app state i prikazi game komponentu
        sessionStorage.setItem("show","game");
        sessionStorage.setItem("channel", channel);
        sessionStorage.setItem("player", player);
        setState({show: 'game',channel: channel, player: player});
        
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
        //promeni app state i prikazi game komponentu
        sessionStorage.setItem("show","game");
        sessionStorage.setItem("channel", channel);
        sessionStorage.setItem("player", player);
        setState({show: 'game',channel: channel, player: player});
        
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
  
  const [state, setState] = useState({show: 'menu', channel: '', player: '', isReady: false, gameStarted: false});


  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = () =>{
    let showSS = sessionStorage.getItem("show");
    let channelSS = sessionStorage.getItem("channel");
    let playerSS = sessionStorage.getItem("player");
    let isReadySS = (sessionStorage.getItem("isReady") == "true")? true: false;
    let gameStartedSS = (sessionStorage.getItem("gameStarted") == "true")? true: false;
    if(showSS)
      setState({show: showSS, channel: channelSS, player: playerSS, isReady: isReadySS, gameStarted: gameStartedSS});
  }

  return (
    
        (state.show == 'menu' || !state.show)? <Menu props={{state: state, setState: (newState) => {
          sessionStorage.setItem("show", newState.show);
          sessionStorage.setItem("channel", newState.channel);
          sessionStorage.setItem("player", newState.player);
          sessionStorage.setItem("isReady", newState.isReady);
          sessionStorage.setItem("gameStarted", newState.gameStarted);
    
          setState(newState);
          }}}/> : (state.show == 'game')? <Game props={{state: state, setState: (newState) => {
            sessionStorage.setItem("show", newState.show);
            sessionStorage.setItem("channel", newState.channel);
            sessionStorage.setItem("player", newState.player);
            sessionStorage.setItem("isReady", newState.isReady);
            sessionStorage.setItem("gameStarted", newState.gameStarted);
      
            setState(newState);
            }}}/> : <></>
      
  );
}

export default App;
