# DigitalOcean GUI Desktop Launcher

A zero-input web application that automatically creates DigitalOcean droplets with GUI desktop access. Configuration is handled through environment variables - just click "Create Droplet" and everything else happens automatically!

## Features

- **Zero User Input**: No forms to fill out - everything is pre-configured
- **Random Droplet Names**: Automatically generates unique, friendly droplet names
- **Environment-Based Configuration**: All credentials stored securely in .env file
- **Web-Based VNC Access**: Connect to your desktop through your browser
- **Ubuntu 22.04 with XFCE**: Lightweight and responsive desktop environment
- **RustDesk Pre-installed**: Alternative remote desktop option

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# DigitalOcean Configuration
DIGITALOCEAN_API_TOKEN=your_digitalocean_api_token_here

# Droplet Credentials
ROOT_PASSWORD=YourSecurePassword123!
VNC_PASSWORD=vnc12345
```

**Important:**
- `DIGITALOCEAN_API_TOKEN`: Get this from your [DigitalOcean API Tokens page](https://cloud.digitalocean.com/account/api/tokens)
- `ROOT_PASSWORD`: Must be at least 8 characters
- `VNC_PASSWORD`: Must be 6-8 characters

### 3. Start the Server

```bash
npm start
```

### 4. Open Your Browser

Navigate to `http://localhost:3000` and click "Create Droplet"!

## How It Works

1. **Click "Create Droplet"**: The application loads your configuration from the .env file
2. **Random Name Generated**: A unique name like "swift-desktop-4521" is automatically created
3. **Droplet Creation**: The app creates your droplet using the DigitalOcean API
4. **Automatic Setup**: Ubuntu 22.04 is installed with XFCE desktop, VNC, and RustDesk
5. **Access Your Desktop**: After ~5 minutes, open the GUI desktop through your browser

## Droplet Specifications

- **OS**: Ubuntu 22.04 LTS
- **Desktop Environment**: XFCE4
- **Size**: 1 vCPU, 1GB RAM (s-1vcpu-1gb)
- **Region**: NYC3
- **Features**: IPv6, Monitoring enabled

## Security Notes

- The `.env` file contains sensitive credentials - **never commit it to git**
- The `.gitignore` file is configured to exclude `.env` automatically
- Change the default passwords in your `.env` file before deploying
- Consider using SSH keys for production environments

## Troubleshooting

### Configuration Error
If you see "Configuration is incomplete", verify:
- Your `.env` file exists in the project root
- All three variables are set (API token, root password, VNC password)
- The server was restarted after updating `.env`

### Droplet Creation Failed
- Verify your DigitalOcean API token is valid
- Check your account has sufficient credit
- Ensure you haven't reached droplet limits

### GUI Not Ready
- The GUI installation takes approximately 5 minutes
- Use "Check GUI Status" to verify readiness
- Wait a bit longer and try again

## API Endpoints

- `GET /api/config` - Returns configuration from environment variables

## Development

### File Structure

```
Tunneling/
├── .env                          # Environment configuration (not in git)
├── .env.example                  # Example configuration file
├── server.js                     # Express server with config API
├── package.json                  # Node.js dependencies
└── public/
    ├── index.html                # Main UI (no input fields)
    └── js/
        ├── app.js                # Main app logic with random name generator
        ├── digitalocean-api.js   # DigitalOcean API functions
        ├── ui.js                 # UI helper functions
        └── userdata-script.js    # Cloud-init script generator
```

## License

MIT