import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
const logo = process.env.PUBLIC_URL + '/logo192.png';

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

const COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];

const App = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [playerID, setPlayerID] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [socket, setSocket] = useState(null);
  const [numPlayers, setNumPlayers] = useState(1);
  const endpoint = "/";
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
    socket.on('player-count', (count) => {
      setNumPlayers(count);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const send = () => {
    if (socket && isMyTurn && input.length === 6) {
      socket.emit('sent-message', input);
      setInput('');
      setIsMyTurn(false);
    }
  };

  const changeInput = (e) => {
    setInput(e.target.value);
  };

  // Render colored pegs for visual flair
  const renderPegs = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      {COLORS.map((color, i) => (
        <div key={i} style={{
          width: 28, height: 28, borderRadius: '50%', background: color,
          margin: '0 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }} />
      ))}
    </div>
  );

  return (
    <div className="mastermind-bg">
      <div className="mastermind-container">
        <img src={logo} alt="Mastermind Logo" style={{ width: 60, margin: '0 auto', display: 'block' }} />
        <h1 className="mastermind-title">Mastermind Multiplayer Game</h1>
        {renderPegs()}
        <pre className="mastermind-rules">{GAME_RULES}</pre>
        <div className="mastermind-playerid">
          Your Player ID: <b>{playerID !== null ? playerID + 1 : '...'}</b> <br />
          Current Players: <b>{numPlayers}</b>
        </div>
        <div className="mastermind-input-row">
          <input
            className="mastermind-input"
            value={input}
            onChange={changeInput}
            maxLength={6}
            placeholder="Enter your guess (6 chars)"
            disabled={!isMyTurn}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
          />
          <button className="mastermind-send-btn" onClick={send} disabled={!isMyTurn || input.length !== 6}>Send</button>
        </div>
        <div className="mastermind-messages">
          {messages.map((message, i) => (
            <div key={i} className="mastermind-message">
              {message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="mastermind-turn-status" style={{ color: isMyTurn ? '#2ecc71' : '#888' }}>
          {isMyTurn ? 'It is your turn!' : 'Waiting for your turn...'}
        </div>
      </div>
    </div>
  );
};

export default App;