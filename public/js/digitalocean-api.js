// DigitalOcean API Functions

const DO_API_BASE = 'https://api.digitalocean.com/v2';

async function createDroplet(token, name, userData) {
    const response = await fetch(`${DO_API_BASE}/droplets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: name,
            region: 'nyc3',
            size: 's-1vcpu-1gb',
            image: 'ubuntu-22-04-x64',
            ssh_keys: [],
            backups: false,
            ipv6: true,
            monitoring: true,
            user_data: userData
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create droplet');
    }

    return await response.json();
}

async function getDroplet(token, dropletId) {
    const response = await fetch(`${DO_API_BASE}/droplets/${dropletId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to get droplet details');
    }

    return await response.json();
}

async function waitForDroplet(token, dropletId, onStatusUpdate) {
    let attempts = 0;
    const maxAttempts = 40;

    while (attempts < maxAttempts) {
        const response = await getDroplet(token, dropletId);
        const droplet = response.droplet;

        if (droplet.status === 'active' && droplet.networks?.v4?.length > 0) {
            // Wait additional time for SSH to be ready
            if (onStatusUpdate) {
                onStatusUpdate('Droplet is active! Waiting for SSH service to be ready...');
            }
            await new Promise(resolve => setTimeout(resolve, 30000));
            return droplet;
        }

        if (onStatusUpdate) {
            onStatusUpdate(`Waiting for droplet... Status: ${droplet.status}`);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
    }

    throw new Error('Timeout waiting for droplet to become active');
}

async function deleteDroplet(token, dropletId) {
    const response = await fetch(`${DO_API_BASE}/droplets/${dropletId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete droplet');
    }

    return true;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createDroplet, getDroplet, waitForDroplet, deleteDroplet };
}
