// UI Helper Functions

function showStatus(element, message, type = 'info') {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';
}

function hideStatus(element) {
    element.style.display = 'none';
}

function showDropletInfo(container, droplet) {
    const html = `
        <h3>Droplet Created Successfully!</h3>
        <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${droplet.name}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Region:</span>
            <span class="info-value">${droplet.region?.slug || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Size:</span>
            <span class="info-value">${droplet.size?.slug || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">${droplet.status}</span>
        </div>
    `;
    container.innerHTML = html;
    container.style.display = 'block';
}

function setButtonLoading(button, loading, loadingText = 'Loading...', originalText = '') {
    if (loading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
    } else {
        button.disabled = false;
        button.textContent = originalText;
    }
}

function showElement(element) {
    element.style.display = 'block';
}

function hideElement(element) {
    element.style.display = 'none';
}

function setConnectionStatus(indicator, text, connected) {
    if (connected) {
        indicator.classList.add('connected');
        text.textContent = 'Connected';
    } else {
        indicator.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}

// Form Validation
function validateForm(fields) {
    for (const field of fields) {
        if (!field.value) {
            return { valid: false, error: field.errorMessage };
        }
        if (field.minLength && field.value.length < field.minLength) {
            return { valid: false, error: field.errorMessage };
        }
        if (field.maxLength && field.value.length > field.maxLength) {
            return { valid: false, error: field.errorMessage };
        }
    }
    return { valid: true };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showStatus,
        hideStatus,
        showDropletInfo,
        setButtonLoading,
        showElement,
        hideElement,
        setConnectionStatus,
        validateForm
    };
}
