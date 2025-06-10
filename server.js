import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = express();
const port = process.env.PORT || 9000;

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(cors());

// Serve static files from React build
server.use(express.static(path.join(__dirname, 'mastermind', 'build')));
server.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'mastermind', 'build', 'index.html'));
});
const httpServer = http.createServer(server);

const io = new Server(httpServer, {
    cors: {
      origin: '*',
    }
});

httpServer.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});

// Store connected clients as an array for easier management
let connectedClients = [];

function generateRandomString() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    while (result.length < 6) {
      const randomChar = characters[Math.floor(Math.random() * characters.length)];
      if (!result.includes(randomChar)) {
        result += randomChar;
      }
    }
  
    return result;
  }

let answerString = generateRandomString();
let guessCount = 0;
let currentTurn = 0;

function compareStrings(guess, answer) {
  
    let x = 0;
    let y = 0;
  
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === answer[i]) {
        x++;
      } else if (answer.includes(guess[i])) {
        y++;
      }
    }
  
    return `${x}, ${y} ,"${guess}"`;
  }
io.on('connection', socket => {
    console.log('User connected:', socket.id);
    connectedClients.push(socket);
    const clientID = connectedClients.indexOf(socket);
    socket.emit('your-ID', clientID);
    io.sockets.emit('player-count', connectedClients.length);
    if (clientID === currentTurn) {
        socket.emit('It-your-turn', 'It your turn.');
    }
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
        const idx = connectedClients.indexOf(socket);
        if (idx !== -1) {
            connectedClients.splice(idx, 1);
            if (currentTurn >= connectedClients.length) {
                currentTurn = 0;
            }
        }
        io.sockets.emit('player-count', connectedClients.length);
        connectedClients.forEach((client, index) => {
            client.emit('your-ID', index);
            if (index === currentTurn) {
                client.emit('It-your-turn', 'It your turn.');
            }
        });
    });
    socket.on('sent-message', message => {
        if (connectedClients[currentTurn] === socket) {
            io.sockets.emit('new-message', compareStrings(message, answerString));
            guessCount++;
            if (message === answerString) {
                io.sockets.emit('new-message', `Player:${currentTurn} WIN!!!!`);
                answerString = generateRandomString();
                guessCount = 0;
                currentTurn = 0;
            } else if (guessCount === 12) {
                io.sockets.emit('new-message', "Game over  REAL ANSWER IS!!!");
                io.sockets.emit('new-message', answerString);
                answerString = generateRandomString();
                guessCount = 0;
                currentTurn = 0;
            } else {
                currentTurn = (currentTurn + 1) % connectedClients.length;
                connectedClients[currentTurn].emit('It-your-turn', 'It your turn.');
            }
        } else {
            socket.emit('not-your-turn', 'Wait for your turn to send a message.');
        }
        console.log('Current turn:', currentTurn);
    });
});

server.get('/answer', (req, res) => {
    res.render(__dirname + '/webpage.ejs', { answer: answerString });
});

// Fallback to React for any unknown routes (after all API/socket routes)
server.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'mastermind', 'build', 'index.html'));
});

export default server;