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
      res.json()
    }).then(r => {
      //console.log(r);
      //setErrorMsg('greska zbog neke nepredvidjene okolnosti');
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
      <button onClick={() => {
        //fetch call
        
      }}>
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
