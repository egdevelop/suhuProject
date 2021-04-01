const { debug } = require("console");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const db = require('./config/db')
const middlewares = require('./middlewares');
var bodyParser = require('body-parser')
const io = require('socket.io')(server);
const ejs = require('ejs');
const path = require('path');
const cors = require('cors');

require('dotenv').config();


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use('/css' , express.static(path.join(__dirname, '/public/css')))
app.use('/img' , express.static(path.join(__dirname, '/public/img')))
app.use('/xlsx' , express.static(path.join(__dirname, '/public/xlsx')))
app.use(cors());
app.use(function(req,res,next){
  req.io = io;
  next();
})

// parse application/json
app.use(bodyParser.json())
//ROUTES
const postRoutes = require('./Routes/post');

app.use('/posts', postRoutes);

app.get("/",(req,ress,next)=>{
    db.query("SELECT * FROM dataSuhu ORDER BY id DESC",(err,hasil)=>{
        ress.render('index.ejs',{data:hasil});
    })
});

let countUserOnline = 1;
io.on("connection", (socket) => {
  socket.on("join", () => {
    console.log("user join");
    countUserOnline++;
    io.emit("countUserOnline", countUserOnline);
  });
});
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
server.listen(5001, () => {
    console.log("http://bryanzz.ddns.net:5001");
  });