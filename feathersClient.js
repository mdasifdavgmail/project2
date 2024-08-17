import io from 'socket.io-client';
import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio';

// Initialize Feathers app
const app = feathers();

// Configure Socket.io client
app.configure(socketio(io('http://localhost:3030')));

// Now you can use app.service('messages') to interact with your messages service
