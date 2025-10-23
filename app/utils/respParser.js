function parseRESP(buffer) {
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
