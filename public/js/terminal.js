// Terminal Management Module

let term = null;
let fitAddon = null;

const terminalTheme = {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#ffffff',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5'
};

function initTerminal(containerId, onDataCallback) {
    // Wait for libraries to load
    if (typeof Terminal === 'undefined' || typeof FitAddon === 'undefined') {
        setTimeout(() => initTerminal(containerId, onDataCallback), 100);
        return;
    }

    term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: terminalTheme
    });

    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById(containerId));
    fitAddon.fit();

    window.addEventListener('resize', () => {
        fitAddon.fit();
    });

    if (onDataCallback) {
        term.onData(onDataCallback);
    }

    return { term, fitAddon };
}

function writeToTerminal(data) {
    if (term) {
        term.write(data);
    }
}

function clearTerminal() {
    if (term) {
        term.clear();
    }
}

function getTerminalSize() {
    if (term) {
        return { cols: term.cols, rows: term.rows };
    }
    return null;
}

function fitTerminal() {
    if (fitAddon) {
        fitAddon.fit();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTerminal,
        writeToTerminal,
        clearTerminal,
        getTerminalSize,
        fitTerminal
    };
}
