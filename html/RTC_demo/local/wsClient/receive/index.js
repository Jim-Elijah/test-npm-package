// import { roomId } from '../const.js'
// console.log('roomId', roomId)


let rule = 'reader',
    userid = '6143e8603246123ce2e7b687'
let socket_url = `ws://localhost:9800/webrtc/${rule}/${userid}`
let roomid = '354682913546354'

let socketB = new WebSocket(socket_url)
let videoElB = document.getElementById("elB");

const savedSend = WebSocket.prototype.send
WebSocket.prototype.send = function (args) {
    console.log('rec send data')
    savedSend.call(this, args)
    console.log('rec send end')
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        socketB.onopen = () => {
            socketB.send(`join|${roomid}`)
        }
    }
    catch (err) {
        console.error(err)
    }
})


// peerB
socketB.onmessage = evt => {
    let string = evt.data
    let value = string.split('|')
    if (value[0] === 'offer') {
        transMedia(value)
    }
    if (value[0] === 'candid') {
        let json = JSON.parse(value[2])
        let candid = new RTCIceCandidate(json)
        peer.addIceCandidate(candid)
    }
}
let answer, peer
const transMedia = async arr => {
    let [_, roomid, sdp] = arr
    console.log('receive');
    let offer = new RTCSessionDescription({ type: 'offer', sdp })
    peer = new RTCPeerConnection()

    // 监听数据传来
    peer.ontrack = async (event) => {
        const [remoteStream] = event.streams;
        videoElB.srcObject = remoteStream;
    };

    await peer.setRemoteDescription(offer)
    let answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    socketB.send(`answer|${roomid}|${answer.sdp}`)

    peer.onconnectionstatechange = event => {
        if (peer.connectionState === 'connected') {
            console.log('rec 对等连接成功！')
        }
        if (peer.connectionState === 'disconnected') {
            console.log('rec 连接已断开！')
        }
    }
}