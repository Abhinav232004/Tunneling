// User Data Script Generator for DigitalOcean Droplet
// This script runs on first boot to configure the droplet

function generateUserDataScript(rootPassword, vncPassword) {
    return `#!/bin/bash
set -e

# Log everything for debugging
exec > /var/log/droplet-setup.log 2>&1

echo "=== Starting droplet setup ==="

# Set root password
echo "root:${rootPassword}" | chpasswd

# Configure SSH
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

echo "=== Installing desktop environment ==="

# Update and install XFCE desktop
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y xfce4 xfce4-goodies dbus-x11

echo "=== Installing VNC server ==="

# Install TigerVNC and noVNC
apt-get install -y tigervnc-standalone-server tigervnc-common novnc websockify

# Create VNC directory for root
mkdir -p /root/.vnc

# Set VNC password (must be 6-8 characters)
echo "${vncPassword}" | vncpasswd -f > /root/.vnc/passwd
chmod 600 /root/.vnc/passwd

# Create VNC xstartup script
cat > /root/.vnc/xstartup << 'XSTARTUP'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
exec startxfce4
XSTARTUP
chmod +x /root/.vnc/xstartup

echo "=== Creating systemd services ==="

# Create VNC systemd service
cat > /etc/systemd/system/vncserver@.service << 'VNCSERVICE'
[Unit]
Description=TigerVNC server on display %i
After=syslog.target network.target

[Service]
Type=forking
User=root
Group=root
WorkingDirectory=/root

ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill :%i > /dev/null 2>&1 || :'
ExecStart=/usr/bin/vncserver :%i -geometry 1920x1080 -depth 24
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
VNCSERVICE

# Create noVNC systemd service
cat > /etc/systemd/system/novnc.service << 'NOVNCSERVICE'
[Unit]
Description=noVNC WebSocket proxy
After=vncserver@1.service
Requires=vncserver@1.service

[Service]
Type=simple
User=root
ExecStart=/usr/bin/websockify --web=/usr/share/novnc/ 6080 localhost:5901
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
NOVNCSERVICE

# Reload systemd and start services
systemctl daemon-reload
systemctl enable vncserver@1.service
systemctl enable novnc.service
systemctl start vncserver@1.service

# Wait for VNC to start
sleep 5

systemctl start novnc.service

echo "=== Installing RustDesk ==="

# Download RustDesk from GitHub releases
wget -q https://github.com/rustdesk/rustdesk/releases/download/1.3.7/rustdesk-1.3.7-x86_64.deb -O /tmp/rustdesk.deb

# Install RustDesk and dependencies
apt-get install -y /tmp/rustdesk.deb

# Clean up
rm /tmp/rustdesk.deb

# Create desktop shortcut for RustDesk
mkdir -p /root/Desktop
cat > /root/Desktop/rustdesk.desktop << 'RUSTDESK'
[Desktop Entry]
Name=RustDesk
Comment=Remote Desktop
Exec=rustdesk
Icon=rustdesk
Terminal=false
Type=Application
Categories=Network;RemoteAccess;
RUSTDESK
chmod +x /root/Desktop/rustdesk.desktop

# Create autostart for RustDesk service
mkdir -p /root/.config/autostart
cp /root/Desktop/rustdesk.desktop /root/.config/autostart/

echo "=== Setup complete ==="
echo "noVNC available at http://YOUR_IP:6080/vnc.html"
echo "RustDesk is installed - launch from desktop or run 'rustdesk'"
`;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateUserDataScript };
}
