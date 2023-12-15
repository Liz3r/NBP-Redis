import './App.css';



let option = "main";

function Main(){

  function changeOption(opt){
    console.log(opt);
  }

  return(
    <>
      <button onClick={() => {
        changeOption("Kurcina")
      }}>
        Create channel
      </button>
      <button>
        Join channel
      </button>
    </>
  );
}

function Menu(){

}

function App() {


  return (
    <Main/>
  );
}

export default App;
