let socket_url = `ws://localhost:8080`
let socketA = new WebSocket(socket_url)

socketA.onopen = () => {
    socketA.send('hello, I am client')
}
socketA.onmessage = (evt) => {
    const { data } = evt
    console.log(`get msg from server: ${data}`);
}
