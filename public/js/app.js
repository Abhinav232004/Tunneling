// Main Application - DigitalOcean GUI Desktop Launcher

// DOM Elements
const elements = {
    // Buttons
    launchBtn: document.getElementById('launchBtn'),
    openGuiBtn: document.getElementById('openGuiBtn'),
    checkGuiBtn: document.getElementById('checkGuiBtn'),
    deleteBtn: document.getElementById('deleteBtn'),

    // Status displays
    statusDiv: document.getElementById('status'),
    guiStatusDiv: document.getElementById('guiStatus'),

    // Sections
    guiSection: document.getElementById('guiSection')
};

// Application State
let dropletData = null;
let config = null;

// Generate random droplet name
function generateRandomDropletName() {
    const adjectives = ['swift', 'bright', 'cosmic', 'quantum', 'cyber', 'nano', 'mega', 'ultra', 'hyper', 'super'];
    const nouns = ['desktop', 'server', 'cloud', 'node', 'hub', 'core', 'lab', 'station', 'instance', 'machine'];
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective}-${noun}-${randomNum}`;
}

// Load configuration from server
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('Failed to load configuration');
        }
        config = await response.json();
        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        throw new Error('Could not load configuration from server. Make sure .env file is properly configured.');
    }
}

// Launch Droplet Handler
async function handleLaunchDroplet() {
    setButtonLoading(elements.launchBtn, true, 'Creating Droplet...', 'Create Droplet');

    try {
        // Load configuration from server
        showStatus(elements.statusDiv, 'Loading configuration...', 'info');
        await loadConfig();

        if (!config.apiToken || !config.rootPassword || !config.vncPassword) {
            throw new Error('Configuration is incomplete. Please check your .env file.');
        }

        // Generate random droplet name
        const name = generateRandomDropletName();

        showStatus(elements.statusDiv, `Creating droplet "${name}"...`, 'info');

        // Generate user data script
        const userData = generateUserDataScript(config.rootPassword, config.vncPassword);

        // Create droplet
        const result = await createDroplet(config.apiToken, name, userData);
        dropletData = result.droplet;

        showStatus(elements.statusDiv, 'Waiting for droplet to become active (this may take 1-2 minutes)...', 'info');

        // Wait for droplet to be active
        const activeDroplet = await waitForDroplet(config.apiToken, dropletData.id, (status) => {
            showStatus(elements.statusDiv, status, 'info');
        });
        dropletData = activeDroplet;

        showStatus(elements.statusDiv, 'Created! Installing (~2 min)', 'success');

        // Show GUI section
        showElement(elements.guiSection);

        showStatus(elements.guiStatusDiv, 'Wait ~2 min then check status', 'info');

    } catch (error) {
        console.error('Error:', error);
        showStatus(elements.statusDiv, `Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(elements.launchBtn, false, '', 'Create Droplet');
    }
}

// Open GUI Desktop Handler
function handleOpenGui() {
    if (!dropletData || !dropletData.networks?.v4?.[0]?.ip_address) {
        showStatus(elements.guiStatusDiv, 'No droplet IP', 'error');
        return;
    }

    const dropletIp = dropletData.networks.v4[0].ip_address;
    const novncUrl = `http://${dropletIp}:6080/vnc.html`;
    window.open(novncUrl, '_blank');

    showStatus(elements.guiStatusDiv, 'Opening...', 'success');
}

// Check GUI Status Handler
async function handleCheckGui() {
    if (!dropletData || !dropletData.networks?.v4?.[0]?.ip_address) {
        showStatus(elements.guiStatusDiv, 'No droplet IP', 'error');
        return;
    }

    const dropletIp = dropletData.networks.v4[0].ip_address;
    showStatus(elements.guiStatusDiv, 'Checking...', 'info');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(`http://${dropletIp}:6080/vnc.html`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        showStatus(elements.guiStatusDiv, 'Ready!', 'success');
    } catch (error) {
        showStatus(elements.guiStatusDiv, 'Not ready yet (~2 min)', 'info');
    }
}

// Delete Droplet Handler
async function handleDeleteDroplet() {
    if (!dropletData || !config) {
        showStatus(elements.guiStatusDiv, 'No droplet to delete', 'error');
        return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete droplet "${dropletData.name}"? This action cannot be undone.`);
    if (!confirmDelete) {
        return;
    }

    setButtonLoading(elements.deleteBtn, true, 'Deleting...', 'Delete Droplet');

    try {
        showStatus(elements.guiStatusDiv, 'Deleting droplet...', 'info');

        await deleteDroplet(config.apiToken, dropletData.id);

        showStatus(elements.guiStatusDiv, 'Droplet deleted successfully!', 'success');

        // Reset state and hide GUI section
        dropletData = null;
        setTimeout(() => {
            hideElement(elements.guiSection);
            elements.statusDiv.textContent = '';
            elements.guiStatusDiv.textContent = '';
        }, 2000);

    } catch (error) {
        console.error('Error deleting droplet:', error);
        showStatus(elements.guiStatusDiv, `Error: ${error.message}`, 'error');
    } finally {
        setButtonLoading(elements.deleteBtn, false, '', 'Delete Droplet');
    }
}

// Event Listeners
elements.launchBtn.addEventListener('click', handleLaunchDroplet);
elements.openGuiBtn.addEventListener('click', handleOpenGui);
elements.checkGuiBtn.addEventListener('click', handleCheckGui);
elements.deleteBtn.addEventListener('click', handleDeleteDroplet);
