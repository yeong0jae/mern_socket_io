const express = require('express');
const dotenv = require('dotenv');
const chats = require('./data/data');
const connectDB = require('./config/db');
const colors = require('colors');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config(); // .env 파일에 있는 환경변수를 process.env에 넣어줌.

connectDB(); // db 연결

const app = express();

app.use(express.json()); // http 요청의 body를 json 형태로 파싱해줌.

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/user', userRoutes); // /api/user로 요청이 들어오면 userRoutes로 보내줌. use 메소드는 요청에 대한 미들웨어 함수를 사용하는 메소드.
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.use(notFound); // 경로가 존재하지 않을 때 에러 처리 미들웨어 함수.
app.use(errorHandler); // 일반적인 에러 처리 미들웨어 함수.

const PORT = process.env.PORT || 8000;

const server = app.listen(8000, () => console.log(`Server running on port ${PORT}`.yellow.bold));

const io = require('socket.io')(server, { // socket.io 서버 생성 (서버의 io)
    pingTimeout: 60000,
    cors : {
        origin: 'http://localhost:3000' // 프론트 서버 주소
    }
});

io.on('connection', (socket)=>{ // 클라이언트가 socket.io 서버에 접속하면 connection 이벤트 발생.
    console.log('connected socket.io');

    socket.on('setup', (userData) => { 
        socket.join(userData._id);
        socket.emit('connected'); // 클라이언트에게 connected 이벤트 발생.
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User join room : ' + room);
    })

    socket.on('typing', (room) => socket.in(room).emit("typing"));
    socket.on('stop typing', (room) => socket.in(room).emit("stop typing")); // in은 topic을 지정해줌. (특정 채팅방에만 이벤트를 발생시키고 싶을 때)

    socket.on('new message', (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if(!chat.users) return console.log('Chat.users not defined');

        chat.users.forEach(user => {
            if(user._id == newMessageRecieved.sender._id) return; // 메시지를 보낸 사람은 메시지를 받지 않음.

            socket.in(user._id).emit('message recieved', newMessageRecieved); // 메시지를 받을 사람에게 message recieved 이벤트 발생.
        })
    })

    socket.off('setup', () => {
        console.log('user disconnected');
        socket.leave(userData._id);
    })
})