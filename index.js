import express, { json } from 'express';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = "Admin"

const app = express()

app.use(json())
app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => console.log(`listening on port ${PORT}`))

// state
const UsersState = {
  users: [],
  setUsers: (newUsersArray) => {
    UsersState.users = newUsersArray
  }
}

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
  socket.emit('message', buildMsg(ADMIN, "Welcome to Chat App!"))

  socket.on('enterRoom', ({ name, room }) => {
    const prevRoom = getUser(socket.id)?.room

    if(prevRoom) {
      // sair do chat antigo
      socket.leave(prevRoom)

      //apenas emitir para o chat antigo
      io.to(prevRoom).emmit('message', buildMsg(ADMIN, `${name} has left the room`))
    }
    
    const user = activateUser(socket.id, name, room)

    // So pode atualizar lista de usuarios no chat após atualizar a listagem de usuarios no state

    if (prevRoom) {
      io.to(prevRoom).emit('userList', { users: getUsersInRoom(prevRoom) })
    }

    socket.join(user.room)

    socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.room} chat room`))

    socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${name} entered the room`))

    io.to(user.room).emit('userList', { users: getUsersInRoom(user.room) })

    io.emit('roomList', {
      rooms: getAllActiveRooms()
    })
  })

  // quando o usuario desconecta - todos os outros
  socket.on('disconnect', () => {
    const user = getUser(socket.id)
    userLeavesApp(socket.id)

    if (user) {
      io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} as left the room`))

      io.to(user.room).emit('userList', {
        users: getUsersInRoom(user.room)
      })

      io.emit('roomList', {
        rooms: getAllActiveRooms()
      })
    }

    console.log(`User ${socket.id} disconnected`)
  })

  //Ouvindo um evento de mensagem
  socket.on('message', ({ name, text }) => {
    const room = getUser(socket.id)?.room

    if (room) {
      io.to(room).emit('message', buildMsg(name, text))
    }
    //envio a mensagem - para todos conectados
    //io.emit('message', `${socket.id.substring(0,5)}: ${data}`)
  })

  // Listen for activity
  socket.on('activity', (name) => {
    const room = getUser(socket.id)?.room

    if (room) {
      socket.broadcast.to(room).emit('activity', name)
    }
  })
})

function buildMsg(name, text) {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(new Date())
  }
}

// User functions
function activateUser(id, name, room) {
  const user = {
    id, 
    name, 
    room
  }
  UsersState.setUsers([
    ...UsersState.users.filter(user => user.id !== id), 
    user
  ])

  return user;
}

function userLeavesApp(id) {
  UsersState.setUsers(
    UsersState.users.filter(user => user.id !== id)
  )
}

function getUser(id) {
  return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room) {
  return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
  return Array.from(new Set(UsersState.users.map(user => user.room)))
}

