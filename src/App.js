import { useState } from 'react';
import './App.css';
import { render } from '@testing-library/react';
import { socket } from './Socket';





function Menu(){

  //fetch fun

  return(
    <div className='menu-div'>

      <div>
        <p>Username</p>
        <input></input>
        <p>Channel name</p>
        <input></input>
      </div>

      <div className='menu-buttons-div'>
      <button onClick={() => {
        //fetch call
      }}>
        Create channel
      </button>
      <button onClick={() => {
        //fetch call
      }}>
        Join channel
      </button>
      </div>

    </div>
  );
}

function App() {
  

  return (
    <Menu/>
  );
}

export default App;
