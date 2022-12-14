// utils/ws.js
// wss：ws服务器实例，app: Koa实例
const WebSocketApi = (wss, app) => {
    // ws: 连接的ws客户端实例
    wss.on("connection", (ws, req) => {
        let { url } = req; // 从url中解析请求参数
        let { cusSender = [], cusReader = [] } = app.context;
        console.log("连接成功", url);
        if (!url.startsWith("/webrtc")) {
            return ws.close(); // 关闭 url 前缀不是 /webrtc 的连接
        }
        let [_, role, uniId] = url.slice(1).split("/");
        if (!uniId) {
            console.log("缺少参数");
            return ws.close();
        }
        console.log("已连接客户端数量：", wss.clients.size);
        // 判断如果是发起端连接
        if (role === "sender") {
            // 此时 uniId 就是 roomid
            ws.roomid = uniId;
            let index = cusSender.findIndex(
                (row) => row.roomid == ws.roomid
            );
            // 判断是否已有该发送端，如果有则更新，没有则添加
            if (index >= 0) {
                cusSender[index] = ws;
            } else {
                cusSender.push(ws);
            }
            app.context.cusSender = [...cusSender];
            console.log('push cusSender', cusSender.length);
        }
        else if (role == 'reader') {
            // 接收端连接
            ws.userid = uniId
            let index = cusReader.findIndex(
                row => row.userid == ws.userid
            )
            // ws.send('ccc' + index)
            if (index >= 0) {
                cusReader[index] = ws
            } else {
                cusReader.push(ws)
            }
            app.context.cusReader = [...cusReader]
            console.log('push reader', cusReader.length);
        }

        ws.on('message', msg => {
            console.log('server get', msg);
            if (typeof msg != 'string') {
                msg = msg.toString()
                // return console.log('类型异常：', typeof msg)
            }
            let { cusSender, cusReader } = app.context
            eventHandel(msg, ws, role, cusSender, cusReader)
        })
        ws.on('close', () => {
            if (role == 'sender') {
                // 清除发起端
                let index = app.context.cusSender.findIndex(row => row == ws)
                app.context.cusSender.splice(index, 1)
                // 解绑接收端
                if (app.context.cusReader && app.context.cusReader.length > 0) {
                    app.context.cusReader
                        .filter(row => row.roomid == ws.roomid)
                        .forEach((row, ind) => {
                            // ???
                            // row.roomid = null
                            app.context.cusReader[ind].roomid = null
                            row.send('leave')
                        })
                }
            }
            else if (role == 'reader') {
                // 接收端关闭逻辑
                let index = app.context.cusReader.findIndex(row => row == ws)
                if (index >= 0) {
                    app.context.cusReader.splice(index, 1)
                }
            }
        })
    });
};

function eventHandel(data, ws, role, cusSender, cusReader) {
    // 来自接收方
    if (role === 'reader') {
        console.log('handle 1')
        let arrval = data.split('|')
        let [type, roomid, val] = arrval
        if (type == 'join') {
            let sender = cusSender.find(row => row.roomid == roomid)
            if (sender) {
                sender.send(`${type}|${ws.userid}`)
            }
        }
        else if (type == 'answer') {
            console.log('handle 2')
            let sender = cusSender.find(row => row.roomid == roomid)
            if (sender) {
                sender.send(`${type}|${ws.userid}|${val}`)
            }
        }
    }
    else if (role === 'sender') {
        let arrval = data.split('|')
        let [type, userid, val] = arrval
        // 注意：这里的 type, userid, val 都是通用值，不管传啥，都会原样传给 reader
        if (type === 'offer') {
            let reader = cusReader.find(row => row.userid == userid)
            if (reader) {
                reader.send(`${type}|${ws.roomid}|${val}`)
            }
        }
        if (type === 'candid') {
            console.log('server candid');
            let reader = cusReader.find(row => row.userid == userid)
            if (reader) {
                reader.send(`${type}|${ws.roomid}|${val}`)
            }
        }
    }
}

module.exports = WebSocketApi;
