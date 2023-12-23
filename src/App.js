import { useState, useRef } from 'react';
import './App.css';
import { render } from '@testing-library/react';
import { socket } from './Socket';





function Menu(){

  const [errorMsg,setErrorMsg] = useState('');

  const usernameInputRef = useRef(null);
  const channelInputRef = useRef(null);
  
  const createChannel = () => {
    fetch(`http://localhost:3001/createChannel/${channelInputRef.current.value}/${usernameInputRef.current.value}`,{
      method: "POST"
    }).then(res => {
      return res.json();
    }).then(data => {
      if(data.success == true){
        console.log(data.message);
        setErrorMsg('');
        //promeni app state i prikazi lobby komponentu
      }else{
        setErrorMsg(data.message);
      }
    }).catch(err => {
      console.log("Error: " + err);
    });
  }

  const joinChannel = () => {
    fetch(`http://localhost:3001/joinChannel/${channelInputRef.current.value}/${usernameInputRef.current.value}`,{
      method: "POST"
    }).then(res => {
      return res.json();
    }).then(data => {
      if(data.success == true){
        console.log(data.message);
        setErrorMsg('');
        //promeni app state i prikazi lobby komponentu
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
  

  return (
    <Menu/>
  );
}

export default App;
