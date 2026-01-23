// Main Application - DigitalOcean GUI Desktop Launcher

// Fixed droplet name
const DROPLET_NAME = 'jumpbox';

// DOM Elements
const elements = {
    createBtn: document.getElementById('createBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    joinBtn: document.getElementById('joinBtn'),
    openGuiBtn: document.getElementById('openGuiBtn'),
    checkGuiBtn: document.getElementById('checkGuiBtn'),
    statusDiv: document.getElementById('status'),
    guiStatusDiv: document.getElementById('guiStatus'),
    guiSection: document.getElementById('guiSection')
};

// Application State
let dropletData = null;
let config = null;

// Load configuration from server
async function loadConfig() {
    if (config) return config;
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Failed to load configuration');
    config = await response.json();
    return config;
}

// Create Droplet Handler
async function handleCreate() {
    setButtonLoading(elements.createBtn, true, 'Creating...', 'Create Droplet');

    try {
        await loadConfig();
        if (!config.apiToken || !config.vncPassword) {
            throw new Error('Configuration incomplete. Check .env file.');
        }

        // Check if droplet already exists
        showStatus(elements.statusDiv, 'Checking for existing droplet...', 'info');
        const existing = await findDropletByName(config.apiToken, DROPLET_NAME);
        if (existing) {
            dropletData = existing;
            showStatus(elements.statusDiv, 'Droplet already exists!', 'success');
            showElement(elements.guiSection);
            showStatus(elements.guiStatusDiv, 'Click Check GUI Status', 'info');
            return;
        }

        showStatus(elements.statusDiv, 'Creating droplet...', 'info');
        const userData = generateUserDataScript(config.vncPassword);
        const result = await createDroplet(config.apiToken, DROPLET_NAME, userData);
        dropletData = result.droplet;

        showStatus(elements.statusDiv, 'Waiting for droplet to become active...', 'info');
        dropletData = await waitForDroplet(config.apiToken, dropletData.id, (status) => {
            showStatus(elements.statusDiv, status, 'info');
        });

        showStatus(elements.statusDiv, 'Created! Wait ~1 min for desktop', 'success');
        showElement(elements.guiSection);
        showStatus(elements.guiStatusDiv, 'Check status in ~1 min', 'info');

    } catch (error) {
        showStatus(elements.statusDiv, `Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(elements.createBtn, false, '', 'Create Droplet');
    }
}

// Delete Droplet Handler
async function handleDelete() {
    setButtonLoading(elements.deleteBtn, true, 'Deleting...', 'Delete Droplet');

    try {
        await loadConfig();

        showStatus(elements.statusDiv, 'Finding droplet...', 'info');
        const droplet = await findDropletByName(config.apiToken, DROPLET_NAME);

        if (!droplet) {
            showStatus(elements.statusDiv, 'No droplet found', 'info');
            return;
        }

        if (!confirm(`Delete droplet "${DROPLET_NAME}"?`)) return;

        showStatus(elements.statusDiv, 'Deleting...', 'info');
        await deleteDroplet(config.apiToken, droplet.id);

        dropletData = null;
        hideElement(elements.guiSection);
        showStatus(elements.statusDiv, 'Deleted!', 'success');
        elements.guiStatusDiv.textContent = '';

    } catch (error) {
        showStatus(elements.statusDiv, `Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(elements.deleteBtn, false, '', 'Delete Droplet');
    }
}

// Join Session Handler
async function handleJoin() {
    setButtonLoading(elements.joinBtn, true, 'Finding...', 'Join Session');

    try {
        await loadConfig();

        showStatus(elements.statusDiv, 'Finding droplet...', 'info');
        const droplet = await findDropletByName(config.apiToken, DROPLET_NAME);

        if (!droplet) {
            showStatus(elements.statusDiv, 'No droplet found. Create one first.', 'error');
            return;
        }

        dropletData = droplet;
        const ip = droplet.networks?.v4?.[0]?.ip_address;

        if (!ip) {
            showStatus(elements.statusDiv, 'Droplet has no IP yet', 'error');
            return;
        }

        showStatus(elements.statusDiv, `Found! IP: ${ip}`, 'success');
        window.open(`http://${ip}:6080/vnc.html`, '_blank');

    } catch (error) {
        showStatus(elements.statusDiv, `Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(elements.joinBtn, false, '', 'Join Session');
    }
}

// Check GUI Status Handler
async function handleCheckGui() {
    if (!dropletData?.networks?.v4?.[0]?.ip_address) {
        showStatus(elements.guiStatusDiv, 'No droplet IP', 'error');
        return;
    }

    const ip = dropletData.networks.v4[0].ip_address;
    showStatus(elements.guiStatusDiv, 'Checking...', 'info');

    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        await fetch(`http://${ip}:6080/vnc.html`, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
        showStatus(elements.guiStatusDiv, 'Ready!', 'success');
    } catch {
        showStatus(elements.guiStatusDiv, 'Not ready yet', 'info');
    }
}

// Open Desktop Handler
function handleOpenGui() {
    if (!dropletData?.networks?.v4?.[0]?.ip_address) {
        showStatus(elements.guiStatusDiv, 'No droplet IP', 'error');
        return;
    }
    const ip = dropletData.networks.v4[0].ip_address;
    window.open(`http://${ip}:6080/vnc.html`, '_blank');
    showStatus(elements.guiStatusDiv, 'Opening...', 'success');
}

// Event Listeners
elements.createBtn.addEventListener('click', handleCreate);
elements.deleteBtn.addEventListener('click', handleDelete);
elements.joinBtn.addEventListener('click', handleJoin);
elements.checkGuiBtn.addEventListener('click', handleCheckGui);
elements.openGuiBtn.addEventListener('click', handleOpenGui);
