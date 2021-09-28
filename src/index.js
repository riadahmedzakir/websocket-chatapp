const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const messageService = require('./utility/messages');
const userService = require('./utility/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.Port || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New websocket connection');

    socket.on('sendMessage', (message, callback) => {
        const user = userService.getUser(socket.id);
        io.to(user.room).emit('message', messageService.generateMessage(user.username, message));

        // Event acknoledgement parameter
        callback('Delivered');
    });

    socket.on('sendLocation', (coords, callback) => {
        const user = userService.getUser(socket.id);
        io.to(user.room).emit('locationMessage', messageService.generateMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    });


    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = userService.addUser({
            id: socket.id,
            username: username,
            room: room
        });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', messageService.generateMessage('System', 'Welcome'));
        socket.broadcast.to(user.room).emit('message', messageService.generateMessage('System', `${username} has joined`));

        console.log(userService.getUser(user.room));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: userService.getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on('disconnect', () => {
        const user = userService.removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', messageService.generateMessage('System', `${user.username} has left the room`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: userService.getUsersInRoom(user.room)
            });
        }

    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});