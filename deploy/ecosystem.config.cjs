// PM2 process file: keeps the app running and restarts it after crashes or reboots.
//   pm2 start deploy/ecosystem.config.cjs && pm2 save
const path = require("path");

module.exports = {
  apps: [
    {
      name: "coredex",
      cwd: path.join(__dirname, ".."),
      script: "node_modules/next/dist/bin/next",
      // Only nginx talks to the app; it is not reachable from outside the server
      args: "start -H 127.0.0.1 -p 3000",
      env: { NODE_ENV: "production" },
      max_memory_restart: "800M",
      time: true,
    },
  ],
};
