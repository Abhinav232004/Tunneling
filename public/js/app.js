// Main Application - DigitalOcean GUI Desktop Launcher

// DOM Elements
const elements = {
    // Inputs
    apiToken: document.getElementById('apiToken'),
    dropletName: document.getElementById('dropletName'),
    rootPassword: document.getElementById('rootPassword'),
    vncPassword: document.getElementById('vncPassword'),

    // Buttons
    launchBtn: document.getElementById('launchBtn'),
    openGuiBtn: document.getElementById('openGuiBtn'),
    checkGuiBtn: document.getElementById('checkGuiBtn'),
    deleteBtn: document.getElementById('deleteBtn'),

    // Status displays
    statusDiv: document.getElementById('status'),
    guiStatusDiv: document.getElementById('guiStatus'),

    // Info containers
    dropletInfoDiv: document.getElementById('dropletInfo'),
    guiInfoDiv: document.getElementById('guiInfo'),
    dropletNameDisplay: document.getElementById('dropletNameDisplay'),
    dropletStatus: document.getElementById('dropletStatus'),

    // Sections
    guiSection: document.getElementById('guiSection')
};

// Application State
let dropletData = null;
let apiToken = '';

// Launch Droplet Handler
async function handleLaunchDroplet() {
    const token = elements.apiToken.value.trim();
    const name = elements.dropletName.value.trim();
    const password = elements.rootPassword.value.trim();
    const vncPass = elements.vncPassword.value.trim();

    // Validate inputs
    const validation = validateForm([
        { value: token, errorMessage: 'Please enter your DigitalOcean API token' },
        { value: name, errorMessage: 'Please enter a droplet name' },
        { value: password, minLength: 8, errorMessage: 'Please enter a password (minimum 8 characters)' },
        { value: vncPass, minLength: 6, maxLength: 8, errorMessage: 'Please enter a VNC password (6-8 characters)' }
    ]);

    if (!validation.valid) {
        showStatus(elements.statusDiv, validation.error, 'error');
        return;
    }

    // Store API token for later use
    apiToken = token;

    setButtonLoading(elements.launchBtn, true, 'Creating Droplet...', 'Create Droplet');

    try {
        showStatus(elements.statusDiv, 'Creating your droplet...', 'info');

        // Generate user data script
        const userData = generateUserDataScript(password, vncPass);

        // Create droplet
        const result = await createDroplet(token, name, userData);
        dropletData = result.droplet;

        showStatus(elements.statusDiv, 'Waiting for droplet to become active (this may take 1-2 minutes)...', 'info');

        // Wait for droplet to be active
        const activeDroplet = await waitForDroplet(token, dropletData.id, (status) => {
            showStatus(elements.statusDiv, status, 'info');
        });
        dropletData = activeDroplet;

        // Update droplet info display
        elements.dropletNameDisplay.textContent = activeDroplet.name;
        elements.dropletStatus.textContent = 'Active - Installing GUI Desktop';

        showStatus(elements.statusDiv, 'Droplet created successfully! GUI desktop is being installed.', 'success');

        // Show GUI section
        showElement(elements.guiSection);
        showElement(elements.guiInfoDiv);

        showStatus(elements.guiStatusDiv, 'GUI desktop is being installed. This will take approximately 5 minutes. Use "Check GUI Status" to verify when ready.', 'info');

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
        showStatus(elements.guiStatusDiv, 'No droplet IP address available', 'error');
        return;
    }

    const dropletIp = dropletData.networks.v4[0].ip_address;
    const novncUrl = `http://${dropletIp}:6080/vnc.html`;
    window.open(novncUrl, '_blank');
}

// Check GUI Status Handler
async function handleCheckGui() {
    if (!dropletData || !dropletData.networks?.v4?.[0]?.ip_address) {
        showStatus(elements.guiStatusDiv, 'No droplet IP address available', 'error');
        return;
    }

    const dropletIp = dropletData.networks.v4[0].ip_address;
    showStatus(elements.guiStatusDiv, 'Checking GUI status...', 'info');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(`http://${dropletIp}:6080/vnc.html`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        elements.dropletStatus.textContent = 'Active - GUI Desktop Ready';
        showStatus(elements.guiStatusDiv, 'GUI Desktop is ready! Click "Open GUI Desktop" to connect.', 'success');
    } catch (error) {
        showStatus(elements.guiStatusDiv, 'GUI is still being installed. Please wait a few more minutes and try again.', 'info');
    }
}

// Delete Droplet Handler
async function handleDeleteDroplet() {
    if (!dropletData || !apiToken) {
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

        await deleteDroplet(apiToken, dropletData.id);

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
