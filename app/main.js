const net = require("net");

// REFERENCE OBJECT FOR CACHE IS key, {value, ExpiryTimestamp}
const cache = new Map();

function parseResp(buffer) {
  const data = buffer.toString();

  // Simple String (+OK)
  if (data.startsWith('+')) {
    return data.slice(1, -2);
  }

  // Integer (:1000)
  if (data.startsWith(':')) {
    return parseInt(data.slice(1, -2), 10);
  }

  // Error (-ERR something)
  if (data.startsWith('-')) {
    throw new Error(data.slice(1, -2));
  }

  // Bulk String ($5\r\nhello\r\n)
  if (data.startsWith('$')) {
    const lines = data.split('\r\n');
    const length = parseInt(lines[0].slice(1), 10);

    if (length === -1) return null; // RESP null bulk string

    return lines[1].slice(0, length);
  }

  // Array (*N)
  if (data.startsWith('*')) {
    let cursor = 1; // skip '*'
    const firstCRLF = data.indexOf('\r\n');
    const arrLen = parseInt(data.slice(cursor, firstCRLF), 10);

    const result = [];
    let offset = firstCRLF + 2; // move past the \r\n

    for (let i = 0; i < arrLen; i++) {
      const prefix = data[offset];
      if (prefix === '$') {
        // Bulk string inside array
        const lenEnd = data.indexOf('\r\n', offset);
        const strLen = parseInt(data.slice(offset + 1, lenEnd), 10);

        if (strLen === -1) {
          result.push(null);
          offset = lenEnd + 2;
        } else {
          const strStart = lenEnd + 2;
          const strEnd = strStart + strLen;
          result.push(data.slice(strStart, strEnd));
          offset = strEnd + 2; // move past string and \r\n
        }
      } else if (prefix === ':') {
        // Integer inside array
        const end = data.indexOf('\r\n', offset);
        result.push(parseInt(data.slice(offset + 1, end), 10));
        offset = end + 2;
      } else if (prefix === '+') {
        // Simple string inside array
        const end = data.indexOf('\r\n', offset);
        result.push(data.slice(offset + 1, end));
        offset = end + 2;
      } else {
        throw new Error(`Unsupported RESP type inside array: ${prefix}`);
      }
    }

    return result;
  }

  throw new Error('Unknown RESP type');
}

const server = net.createServer((connection) => {
  // Handle connection
  connection.on("data", (data) => {
    // Now connection has a parsed data from RESP parser that knows which type is the data, we are treating PING and ECHO but the parser can throw errors for unknown types
    const parsedData = parseResp(data)
    // PING CMD
    if (parsedData[0].toUpperCase() === "PING") {
      connection.write("+PONG\r\n");
    }
    // ECHO CMD
    else if (typeof parsedData === 'object' && parsedData[0].toUpperCase() === "ECHO") {
      // This is made to remove ECHO from the response
      parsedData.splice(0, 1);
      const respArray = [`$${parsedData[0].length}\r\n`];
      for (const str of parsedData) {
        respArray.push(str, `\r\n`);
      }
      connection.write(respArray.join(''));
    }
    // SET CMD
    else if (parsedData[0].toUpperCase() === "SET") {
      // This is made to remove SET from the response otherwise it would try to set "SET" as a key :)
      parsedData.splice(0, 1);
      if (parsedData.length >= 2 && parsedData[parsedData.length - 2].toUpperCase().includes("EX") ) {
        const expiryMiliSeconds = parseInt(parsedData[parsedData.length - 1], 10) * 1000;
        const expiryTimestamp = Date.now() + expiryMiliSeconds;
        for (let i = 0; i < parsedData.length - 2; i += 2) {
          const key = parsedData[i];
          const value = parsedData[i + 1];
          cache.set(key, {"value": value, "expiryTimestamp": new Date(expiryTimestamp)});
          setTimeout(() => {
            cache.delete(key);
          }, expiryMiliSeconds);
        }
      } else if (parsedData.length >= 2 && parsedData[parsedData.length - 2].toUpperCase().includes("PX")) {
        const expirySeconds = parseInt(parsedData[parsedData.length - 1], 10);
        const expiryTimestamp = Date.now() + expirySeconds;
        // console.log(`Attempt to parse ${parsedData[parsedData.length - 1]} as PX expiry milliseconds: ${expirySeconds}`);
        for (let i = 0; i < parsedData.length - 2; i += 2) {
          const key = parsedData[i];
          const value = parsedData[i + 1];
          cache.set(key, {"value": value, "expiryTimestamp": new Date(expiryTimestamp)});
          setTimeout(() => {
            cache.delete(key);
          }, expirySeconds);
        }
      } else {
        for (let i = 0; i < parsedData.length; i += 2) {
          // This is made to get the value of the key and its value while setting on cache
          const key = parsedData[i];
          cache.set(key, {"value": parsedData[i + 1], "expiryTimestamp": null});
        }
      }
      connection.write("+OK\r\n");
      // console.log(`Current cache: ${JSON.stringify(Object.fromEntries(cache.entries()))}`);
    }
    // GET CMD
    else if (parsedData[0].toUpperCase() === "GET") {
      const key = parsedData[1];
      if (cache.has(key)) {
        const entry = cache.get(key);
        connection.write(`$${entry.value.length}\r\n${entry.value}\r\n`);
      } else {
        connection.write("$-1\r\n");
      }
    }
  });
});

server.listen(6379, "127.0.0.1");
