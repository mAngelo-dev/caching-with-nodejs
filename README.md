# 🧠 Build Your Own Redis (Node.js)

[![Codecrafters Progress](https://backend.codecrafters.io/progress/redis/f246185d-214b-4d18-9c75-452f40b72af5)](https://app.codecrafters.io/users/codecrafters-bot?r=2qF)

This project is a **Node.js implementation** inspired by the [**“Build Your Own Redis”**](https://codecrafters.io/challenges/redis) challenge on **Codecrafters**.
The goal is to build a minimal **Redis-like server** from scratch, understanding how Redis works internally — including the **RESP protocol**, **event loops**, and **in-memory storage**.

---

## 🚀 Project Overview

The objective is to recreate a basic Redis server capable of handling core commands such as:

* `PING` → returns `PONG`
* `SET key value` → stores a value
* `GET key` → retrieves a stored value
* (Future stages) support for key expiration (`EX`), multiple clients, and replication

---

## 🧩 Project Structure

```
📦 codecrafters-redis-javascript
├── app/
│   ├── main.js        # Entry point of the Redis server
├── your_program.sh    # Startup script
├── package.json
└── README.md
```

---

## ⚙️ Running the Project

### Prerequisites

* **Node.js v21+**
* **Git**

### Start the Redis server

```bash
# Clone the repository
git clone https://github.com/mAngelo-dev/caching-with-nodejs.git
cd caching-with-nodejs

# Install dependencies (if any)
npm install

# Run the server
./your_program.sh
```

The server listens for TCP connections (usually on port `6379`).

---

## 🧪 Testing the Server

You can test it using the **redis-cli**:

```bash
redis-cli -p 6379
```

Try running the following commands:

```
PING
SET mykey "Hello World"
GET mykey
```

---

## 🧱 Understanding the RESP Protocol

Redis communicates using the **REdis Serialization Protocol (RESP)**.
Example of a raw TCP request:

```
*1\r\n$4\r\nPING\r\n
```

Expected response:

```
+PONG\r\n
```

This project manually parses and responds to RESP messages using Node.js’s `net` module.

---

## 🧠 Key Concepts Learned

While developing this project, I explored:

* Building **TCP servers** with Node.js `net` module
* Parsing binary/text protocols (RESP)
* **In-memory caching** using `Map` and TTL management
* Handling **buffers and byte streams** efficiently
* Understanding **client-server protocols** and **event-driven concurrency**

---

## 🧭 Next Steps

* Add support for `EX` and `PX` (key expiration)
* Handle multiple clients concurrently
* Improve logging and error handling
* Add automated tests

---

## 👨‍💻 Author

**Miguel Angelo (Migs)**
📍 Web Developer | Exploring distributed systems and backend architecture
🔗 [GitHub Profile](https://github.com/mAngelo-dev)

AI was used to generate documentation and with some minor fixes on parseResp functionality.
---
