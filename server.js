const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const helmet = require('helmet');
const cors = require('cors');
const socket = require('socket.io');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');
const app = express();
require('dotenv').config();
const nocache = require('nocache');

app.use(helmet());
app.use(nocache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use(cors({origin: '*'}));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.route('/').get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 
fccTestingRoutes(app);
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});
const portNum = process.env.PORT || 3000;
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});
const io = socket(server);
const Collectible = require('./public/Collectible');
const { starting_position, calculations } = require('./public/canvas');
let currPlayers = [];
const destroyedCoins = [];
const generateCoin = () => {
  const rand = Math.random();
  let coinValue;
  if (rand < 0.6) {
    coinValue = 1;
  } else if (rand < 0.85) {
    coinValue = 2;
  } else {
    coinValue = 3;
  }
  return new Collectible({ 
    x: starting_position(calculations.playFieldMinX, calculations.playFieldMaxX, 5),
    y: starting_position(calculations.playFieldMinY, calculations.playFieldMaxY, 5),
    value: coinValue,
    id: Date.now()
  });
}
let coin = generateCoin();
io.sockets.on('connection', socket => {
  console.log(`New connection ${socket.id}`);
  socket.emit('init', { id: socket.id, players: currPlayers, coin });
  socket.on('new-player', obj => {
    obj.id = socket.id;
    currPlayers.push(obj);
    socket.broadcast.emit('new-player', obj);
  });
  socket.on('move-player', (dir, obj) => {
    const movingPlayer = currPlayers.find(player => player.id === socket.id);
    if (movingPlayer) {
      movingPlayer.x = obj.x;
      movingPlayer.y = obj.y;
      socket.broadcast.emit('move-player', { id: socket.id, dir, posObj: { x: movingPlayer.x, y: movingPlayer.y } });
    }
  });
  socket.on('stop-player', (dir, obj) => {
    const stoppingPlayer = currPlayers.find(player => player.id === socket.id);
    if (stoppingPlayer) {
      stoppingPlayer.x = obj.x;
      stoppingPlayer.y = obj.y;

      socket.broadcast.emit('stop-player', { id: socket.id, dir, posObj: { x: stoppingPlayer.x, y: stoppingPlayer.y } });
    }
  });
  socket.on('destroy-item', ({ playerId, coinValue, coinId }) => {
    if (!destroyedCoins.includes(coinId)) {
      const scoringPlayer = currPlayers.find(obj => obj.id === playerId);
      const sock = io.sockets.connected[scoringPlayer.id];
      scoringPlayer.score += coinValue;
      destroyedCoins.push(coinId);
      io.emit('update-player', scoringPlayer);
      if (scoringPlayer.score >= 100) {
        sock.emit('end-game', 'win');
        sock.broadcast.emit('end-game', 'lose');
      } 
      coin = generateCoin();
      io.emit('new-coin', coin);
    }
  });
  socket.on('disconnect', () => {
    socket.broadcast.emit('remove-player', socket.id);
    currPlayers = currPlayers.filter(player => player.id !== socket.id);
  });
});

module.exports = app; 