fs = require 'fs'
zmq = require 'zmq'
_ = require 'lodash'

shell_socket = zmq.socket 'dealer'
io_socket    = zmq.socket 'sub'

shell_socket.identity = 'dealer' + process.pid
io_socket.identity = 'sub' + process.pid

shell_socket.on 'message', (msg...) ->
    console.log "new shell message"
    _.forEach(msg,(item) ->
            console.log "shell received:", item.toString('utf8'))

io_socket.on 'message', (msg...) ->
    console.log "new IO message"
    _.forEach(msg, (item) ->
        console.log "io received:", item.toString('utf8'))


kernel_file_name = 'kernel-5666.json'
kernel_file_path = '/Users/will/Library/Jupyter/runtime/' + kernel_file_name
kernel_info = JSON.parse fs.readFileSync(kernel_file_path)

shell_port = kernel_info.shell_port
io_port = kernel_info.iopub_port

shell_socket.connect('tcp://127.0.0.1:' + shell_port)
io_socket.connect('tcp://127.0.0.1:' + io_port)
io_socket.subscribe('')

# console.log io_socket

header = JSON.stringify({
            msg_id: 0,
            username: "will",
            session: 0,
            msg_type: "execute_request",
            version: "5.0"
        })

shell_socket.send(
    [
        '<IDS|MSG>',
        '',
        header,
        '{}',
        '{}',
        JSON.stringify({
                code: "a - 4"
                silent: false
                store_history: true
                user_expressions: {}
                allow_stdin: false
            })
    ])
