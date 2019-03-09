module.exports = {
  apps: [{
    name: 'GameServer',
    script: 'app.js',

    instances: 1,
    autorestart: true
  }]
};
