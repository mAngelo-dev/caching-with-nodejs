const net = require("net");

const client = net.createConnection({ port: 6379, host: "127.0.0.1" }, () => {
  console.log("Connected to server ✅");

  // 1️⃣ Send SET command: SET foo bar
  const setCmd = "*3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n$2\r\nPX\r\n$3\r\n5000\r\n";
  client.write(setCmd);

  // 2️⃣ Wait a bit, then send GET command: GET foo
  setTimeout(() => {
    const getCmd = "*2\r\n$3\r\nGET\r\n$3\r\neba\r\n";
    client.write(getCmd);
  }, 100);
});

client.on("data", (data) => {
  console.log("Server replied:", data.toString());
});

client.on("error", (err) => {
  console.error("Client error:", err.message);
});

client.on("end", () => {
  console.log("Disconnected ❌");
});
