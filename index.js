import express, { json } from 'express';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = process.env.PORT || 3500
const app = express()

app.use(json())
app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => console.log(`listening on port ${PORT}`))

const io = new Server(expressServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : 
    ["http://localhost:5500", "http://127.0.0.1:5500"]
  }
})

//quando acontecer uma conexão, capturo o socket
io.on('connection', socket => {
  console.log(`User ${socket.id} connected`)

  //Upon connection - only to user
  socket.emit('message', "Welcome to Chat App")

  //Upon connection - to all else
  socket.broadcast.emit('message', `User ${socket.id.substring(0,5)} connected`)

  //Ouvindo um evento de mensagem
  socket.on('message', data => {
    console.log(data)

    //envio a mensagem - para todos conectados
    io.emit('message', `${socket.id.substring(0,5)}: ${data}`)
  })

  // quando o usuario desconecta - todos os outros
  socket.on('disconnect', () => {
    socket.broadcast.emit('message', `User ${socket.id.substring(0,5)} disconnected`)
  })

  // Listen for activity
  socket.on('activity', (name) => {
    socket.broadcast.emit('activity', name)
  })
})
