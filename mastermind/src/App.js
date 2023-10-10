import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const App = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [PlayerID, setID] = useState([]);

  const [socket, setSocket] = useState(null);
  const endpoint = "http://localhost:9000";

  useEffect(() => {
    const socket = io(endpoint);
    setSocket(socket);
    socket.on('new-message', (newMessage) => {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        });
    socket.on('not-your-turn', (newMessage) => {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        });
    socket.on('It-your-turn', (newMessage) => {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        });
    socket.on('your-ID', (newMessage) => {
          setID([newMessage]);
        });
    return () => socket.disconnect();
  }, [setSocket]);


  const send = () => {
    if (socket) {
      socket.emit('sent-message', input);
      console.log("sent");
      setInput('');
    }
  }

  const changeInput = (e) => {
    setInput(e.target.value);
  }

  return (
    <div>
      <div>
        Player:{PlayerID}
      </div>
      
      <div style={style}>
        <input value={input} onChange={changeInput}  maxLength={6}/>
        <button onClick={send}>Send</button>
      </div>
      {messages.map((message, i) => (
       (
          <div key={i} style={style}>
            {message}
          </div>
        )
      ))}
    </div>
  );
}

const style = { marginTop: 20, paddingLeft: 50 };

export default App;