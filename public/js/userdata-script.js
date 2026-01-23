// User Data Script Generator for DigitalOcean Droplet
// Minimal script for snapshot-based deployment

function generateUserDataScript(vncPassword) {
    // Escape special characters for bash
    const escapedPassword = vncPassword.replace(/'/g, "'\\''");

    return `#!/bin/bash
set -e

mkdir -p /root/.vnc
echo '${escapedPassword}' | vncpasswd -f > /root/.vnc/passwd
chmod 600 /root/.vnc/passwd

systemctl start vncserver@1.service
sleep 3
systemctl start novnc.service
`;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateUserDataScript };
}
