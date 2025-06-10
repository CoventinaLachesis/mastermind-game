import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const GAME_RULES = `
Mastermind Game Rules:
1. The server randomly selects a 6-character code (letters and digits, no repeats).
2. Players take turns guessing the code. After each guess, the server responds with:
   - The number of correct characters in the correct position.
   - The number of correct characters in the wrong position.
   - The guess you made.
3. Example:
   Secret: 620439
   Player 1 guesses: 632057 → Response: 1 (correct position), 3 (correct chars, wrong position)
4. At least 2 players are required.
5. Each game allows up to 12 guesses in total. If no one guesses correctly, the answer is revealed and a new game starts.
6. Only the player whose turn it is can guess. Others must wait for their turn.
7. The game uses real-time communication (Socket.io).
`;

const App = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [playerID, setPlayerID] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [socket, setSocket] = useState(null);
  const endpoint = "http://localhost:9000";
  const messagesEndRef = useRef(null);

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
      setIsMyTurn(true);
    });
    socket.on('your-ID', (id) => {
      setPlayerID(id);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const send = () => {
    if (socket && isMyTurn && input.length === 6) {
      socket.emit('sent-message', input);
      setInput('');
      setIsMyTurn(false); // Wait for next turn
    }
  };

  const changeInput = (e) => {
    setInput(e.target.value);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      <h2>Mastermind Multiplayer Game</h2>
      <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 8, fontSize: 13, whiteSpace: 'pre-wrap', marginBottom: 20 }}>{GAME_RULES}</pre>
      <div style={{ marginBottom: 10 }}>Your Player ID: <b>{playerID !== null ? playerID : '...'}</b></div>
      <div style={style}>
        <input
          value={input}
          onChange={changeInput}
          maxLength={6}
          placeholder="Enter your guess (6 chars)"
          disabled={!isMyTurn}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
        />
        <button onClick={send} disabled={!isMyTurn || input.length !== 6}>Send</button>
      </div>
      <div style={{ minHeight: 200, marginTop: 20, background: '#f9f9f9', borderRadius: 8, padding: 10, overflowY: 'auto', maxHeight: 300 }}>
        {messages.map((message, i) => (
          <div key={i} style={style}>
            {message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ marginTop: 10, color: isMyTurn ? 'green' : 'gray' }}>
        {isMyTurn ? 'It is your turn!' : 'Waiting for your turn...'}
      </div>
    </div>
  );
};

const style = { marginTop: 10, paddingLeft: 10 };

export default App;