// PM2 process definition. On the server: pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: "xmas-presents",
      script: "node_modules/.bin/next",
      args: "start -p 3002",
      cwd: __dirname,
      env: { NODE_ENV: "production", PORT: "3002" },
    },
  ],
};
