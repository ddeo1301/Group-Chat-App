const express = require('express');
const bodyparser= require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()

const http = require('http')
const path = require('path');

const sequelize = require('./util/database')

const User = require('./models/user')
const Chat = require('./models/chat')
const Group = require('./models/group')
const GroupTable = require('./models/groupTable')

const userRoutes = require('./routes/user')
const chatRoutes = require('./routes/chat')
const groupRoutes = require('./routes/group')

const app = express();

const httpServer = http.createServer(app)
const socketio = require('socket.io')
const io = socketio(httpServer,{cors:{
    origin:'*'
}})

app.use(cors({
    origin:'*' //accept request from every origin if we specify address than sorce will get limited
}));
app.use(bodyparser.json({extended:false}))

app.use('/user', userRoutes)
app.use('/chat', chatRoutes)
app.use('/group', groupRoutes)

app.use((req,res,next)=>{
    res.sendFile(path.join(__dirname, `../frontend/${req.url}`))
})

io.on('connection',socket=>{
    console.log(socket.id,'user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
      });
    socket.on('message', message => {
        console.log(message)
        socket.broadcast.emit('response', message)
    });
});
 

User.hasMany(Chat);
Chat.belongsTo(User);

Group.hasMany(Chat)
Chat.belongsTo(Group);

User.belongsToMany(Group,{through:GroupTable});
Group.belongsToMany(User,{through:GroupTable});

sequelize.sync({force:false})
.then(httpServer.listen(3000))
.catch(err=>console.log(err))

