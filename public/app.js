const socket = io('ws://localhost:3500')

const msgInput = document.querySelector('#message');
const nameInput = document.querySelector('#name');
const chatRoom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const usersList = document.querySelector('.user-list');
const roomsList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');

function sendMessage(e) {
  e.preventDefault();

  if (nameInput.value && msgInput.value && chatRoom.value) {
    socket.emit('message', {
      text: msgInput.value,
      name: nameInput.value
    })
    msgInput.value = ''
  }
  msgInput.focus()
}

function enterRoom(e) {
  e.preventDefault()

  if(nameInput.value && chatRoom.value) {
    socket.emit('enterRoom', {
      name: nameInput.value,
      room: chatRoom.value
    })
  }
}

document.querySelector('.form-join')
  .addEventListener('submit', enterRoom)

document.querySelector('.form-msg')
  .addEventListener('submit', sendMessage)

msgInput.addEventListener('keypress', () => {
  socket.emit('activity', nameInput.value)
})

// Listen for messages
socket.on('message', (data) => {
  activity.textContent = ''
  const { name, text, time } = data

  const li = document.createElement('li')
  li.className = 'post'

  if (name === nameInput.value) li.className = 'post post--left'
  if (name !== nameInput.value && name !== 'Admin') li.className = 'post post--right'

  if (name !== 'Admin') {
    li.innerHTML = `<div class='post__header ${name === nameInput.value 
      ? 'post__header--user' 
      : 'post__header--reply'}'
      >
        <span class="post__header--name">${name}</span>
        <span class="post__header--time">${time}</span>
      </div>
      <div class=='post__text'>${text}</div>`
  } else {
    li.innerHTML = `<div class='post__text'>${text}</div>`
  }

  document.querySelector('#list').appendChild(li)

  chatDisplay.scrollTop = chatDisplay.scrollHeight
})

let activityTimer
socket.on('activity', (name) => {
  activity.textContent = `${name} is typing...`

  clearTimeout(activityTimer)
  activityTimer = setTimeout(() => {
    activity.textContent = ""
  }, 3000)
})

socket.on('userList', ({ users }) => {
  showUsers(users)
})

socket.on('roomList', ({ rooms }) => {
  showRooms(rooms)
})

function showUsers(users) {
  usersList.textContent = ''

  if (users) {
    usersList.innerHTML = `
    <em>
      Users in ${chatRoom.value}: ${users.map((user) => user.name).join(", ")} 
    </em>`
  }
}

function showRooms(rooms) {
  roomsList.textContent = ''

  if (rooms) {
    roomsList.innerHTML = `
    <em>
      Active rooms: ${rooms.join(", ")} 
    </em>`
  }
}
