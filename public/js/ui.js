// UI Helper Functions

function showStatus(element, message, type = 'info') {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';
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
