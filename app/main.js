const net = require("net");
const parseResp = require("./utils/parseResp");


const server = net.createServer((connection) => {
  // Handle connection
  connection.on("data", (data) => {
    // Now connection has a parsed data from RESP parser that knows which type is the data, we are treating PING and ECHO but the parser can throw errors for unknown types
    const parsedData = parseResp(data)
    if (parsedData === "PING") {
      connection.write("+PONG\r\n");
    } else {
      if (typeof parsedData === 'object' && parsedData[0] === "ECHO") {
        // This is made to remove ECHO from the response
        parsedData.splice(0, 1);
        const message = parsedData[0];
        connection.write(`$${message.length}\r\n${message}\r\n`);
      }
    }
  })
});

server.listen(6379, "127.0.0.1");
