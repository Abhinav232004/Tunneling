// SSH Client Module using Socket.IO

let socket = null;
let onOutputCallback = null;
let onStatusCallback = null;
let onErrorCallback = null;

function connectSSH(serverUrl, host, username, password, callbacks = {}) {
    onOutputCallback = callbacks.onOutput;
    onStatusCallback = callbacks.onStatus;
    onErrorCallback = callbacks.onError;

    socket = io(serverUrl);

    socket.on('connect', () => {
        if (onStatusCallback) {
            onStatusCallback('connecting');
        }

        socket.emit('start-ssh', {
            host: host,
            username: username,
            password: password
        });
    });

    socket.on('ssh-status', (data) => {
        if (onStatusCallback) {
            onStatusCallback(data.status);
        }
    });

    socket.on('ssh-output', (data) => {
        if (onOutputCallback) {
            onOutputCallback(data);
        }
    });

    socket.on('ssh-error', (data) => {
        if (onErrorCallback) {
            onErrorCallback(data.error);
        }
    });

    socket.on('disconnect', () => {
        if (onStatusCallback) {
            onStatusCallback('disconnected');
        }
    });

    return socket;
}

function sendInput(data) {
    if (socket) {
        socket.emit('ssh-input', data);
    }
}

function resizeTerminal(cols, rows) {
    if (socket) {
        socket.emit('resize', { cols, rows });
    }
}

function disconnectSSH() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

function isConnected() {
    return socket && socket.connected;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        connectSSH,
        sendInput,
        resizeTerminal,
        disconnectSSH,
        isConnected
    };
}
