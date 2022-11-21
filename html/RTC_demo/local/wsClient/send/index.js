// import { roomId } from '../const.js'
// console.log('roomId', roomId)

let rule = 'sender'

let  roomid = '354682913546354'
let socket_url = `ws://localhost:9800/webrtc/${rule}/${roomid}`
let socketA = new WebSocket(socket_url)
let videoElA = document.getElementById("elA");
let localStream

window.addEventListener('DOMContentLoaded', async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        videoElA.srcObject = localStream; // 在 video 标签上播放媒体流
    }
    catch (err) {
        console.error(err)
    }
})

const savedSend = WebSocket.prototype.send
WebSocket.prototype.send = function (args) {
    console.log('rec send data', args)
    savedSend.call(this, args)
    console.log('rec send end')
}
// peerA
socketA.onmessage = async evt => {
    let string = evt.data
    let [type, userid, sdp] = string.split('|')
    if (type === 'join') {
        peerInit(userid)
    }
    else if (type === 'answer') {
        let answer = new RTCSessionDescription({
            type: 'answer',
            sdp,
        })
        await peer.setLocalDescription(offer)
        await peer.setRemoteDescription(answer)
    }
}
let offer, peer
const peerInit = async usid => {
    // 1. 创建连接
    peer = new RTCPeerConnection()
    // 2. 添加视频流轨道
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream)
    })
    // 3. 创建 SDP
    offer = await peer.createOffer()
    // 4. 发送 SDP
    socketA.send(`offer|${usid}|${offer.sdp}`)


    // peerA
    peer.onicecandidate = event => {
        if (event.candidate) {
            let candid = event.candidate.toJSON()
            console.log('send candid', candid)
            socketA.send(`candid|${usid}|${JSON.stringify(candid)}`)
        }
    }

    peer.onconnectionstatechange = event => {
        if (peer.connectionState === 'connected') {
            console.log('send 对等连接成功！')
        }
        if (peer.connectionState === 'disconnected') {
            console.log('send 连接已断开！')
        }
    }

}
