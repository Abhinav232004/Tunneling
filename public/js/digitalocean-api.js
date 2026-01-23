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
            region: 'sgp1',
            size: 's-2vcpu-4gb',
            image: 214450589,
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
            if (onStatusUpdate) {
                onStatusUpdate('Droplet is active! Starting desktop...');
            }
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

async function findDropletByName(token, name) {
    const response = await fetch(`${DO_API_BASE}/droplets?name=${encodeURIComponent(name)}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to search droplets');
    }

    const data = await response.json();
    const droplet = data.droplets.find(d => d.name === name);
    return droplet || null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createDroplet, getDroplet, waitForDroplet, deleteDroplet };
}
