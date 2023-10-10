import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = express();
const port = 9000;

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
    extended: true
}));

server.use(cors());

const httpServer = http.createServer(server);

const io = new Server(httpServer, {
    cors: {
      origin: '*',
    }
});

httpServer.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});

// Store connected clients and their ports
const connectedClients = new Map();



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
//game
var answerstring = generateRandomString();
var turn=0;
function compareStrings(string1, string2) {
  
    let x = 0;
    let y = 0;
  
    for (let i = 0; i < string1.length; i++) {
      if (string1[i] === string2[i]) {
        x++;
      } else if (string2.includes(string1[i])) {
        y++;
      }
    }
  
    return `${x}, ${y} ,"${string1}"`;
  }
let currentTurn = 0;
io.on('connection', client => {
    console.log('User connected');
    
    // Assign a port to the client
    const clientPort = port + connectedClients.size + 1;
    connectedClients.set(client, clientPort);
    console.log(`Client on port ${clientPort}`);

    // Send the client their index in the turn-based order
    const clientID = Array.from(connectedClients.keys()).indexOf(client);
    client.emit('your-ID', clientID);
    if(clientID===currentTurn){
            client.emit('It-your-turn','It your turn.')
        }
    client.on('disconnect', () => {
        console.log(`User on port ${clientPort} disconnected`);
        connectedClients.delete(client);
        const clientIndex = Array.from(connectedClients.keys());
        clientIndex.forEach((client, index) => {
            client.emit('your-ID', index);
            if(clientIndex[currentTurn]===client){
                client.emit('It-your-turn','It your turn.')
            }
        });

    });
    
    client.on('sent-message', function (message) {
        // Check if it's the client's turn to send a message
        const clientIndex = Array.from(connectedClients.keys());
        if (clientIndex[currentTurn] === client) {
            // If it's their turn, broadcast the message to all clients
            io.sockets.emit('new-message', compareStrings(message,answerstring) );
            console.log(`Client on port ${clientPort} sent a message: ${message}`);
            turn++;
            if(message===answerstring) {
            io.sockets.emit('new-message',`Player:${currentTurn} WIN!!!!` );
            answerstring=generateRandomString();
            }
            else if(turn==12){
                io.sockets.emit('new-message', "Game over  REAL ANSWER IS!!!" );
                io.sockets.emit('new-message', answerstring );
            }
            else {
                currentTurn = (currentTurn + 1) % connectedClients.size;
                clientIndex[currentTurn].emit('It-your-turn','It your turn.')
            }
        } else {
            // It's not their turn, send a message indicating that
            client.emit('not-your-turn', 'Wait for your turn to send a message.');
        }
        console.log(currentTurn)
    });
});


server.get('/answer', (req, res) => {
    res.render(__dirname + '/webpage.ejs',{answer:answerstring});
});

export default server;