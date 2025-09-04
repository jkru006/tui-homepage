# TUI Homepage

[![Version](https://img.shields.io/github/v/tag/jkru006/tui-homepage?label=version&color=blue&cache_seconds=3600)](https://github.com/jkru006/tui-homepage/tags)

A terminal-style new tab page with a schedule-aware school menu and to-do list. Designed as a productivity dashboard for students.

## Features

- Terminal-like interface with consistent TUI styling across all menus
- Complete keyboard navigation (arrow keys, enter, escape)
- Main menu with quick access to frequently used sites
- School menu with dynamically loaded class links and schedule integration
- Schedule-aware class selection that highlights current/next class
- Schedule sidebar that shows today's timetable with real-time highlighting
- Coursework section that displays upcoming assignments by class
- To-do list for managing tasks
- Status bar with context-aware URL previews
- Animated terminal-style background

## Setup Guide (Linux)

### Prerequisites Installation

1. Update your package lists:
   ```bash
   sudo apt update
   ```

2. Install Git:
   ```bash
   sudo apt install git
   ```

3. Install Node.js and npm:
   ```bash
   sudo apt install nodejs npm
   ```

4. Verify installations:
   ```bash
   git --version
   node --version
   npm --version
   ```

### Setting Up TUI Homepage

1. Clone this repository:
   ```bash
   git clone https://github.com/jkru006/tui-homepage.git
   ```

2. Navigate to the project directory:
   ```bash
   cd tui-homepage
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file with your Canvas API token (if using Canvas features):
   ```bash
   echo "CANVAS_TOKEN=your_token_here" > .env
   ```
   
   Replace `your_token_here` with your actual Canvas API token.

5. Configure your class schedule in `public/config/schedule-config.json`:
   - Edit the file to match your personal class schedule
   - Format is organized by day of the week
   - Each class needs a time range and subject

6. Start the server:
   ```bash
   npm start
   ```

7. Open http://localhost:3001 in your browser

### Setting as New Tab Page in Firefox

1. Open Firefox and go to Preferences/Options
2. Under Home Page, enter: `http://localhost:3001`
3. To set as New Tab page:
   - Install the "New Tab Override" extension
   - Configure it to use `http://localhost:3001`

### Running as a Service (Auto-start)

1. Create a service file:
   ```bash
   sudo nano /etc/systemd/system/tui-homepage.service
   ```

2. Add the following content (update paths as needed):
   ```
   [Unit]
   Description=TUI Homepage Server
   After=network.target

   [Service]
   ExecStart=/usr/bin/node /path/to/tui-homepage/server.js
   WorkingDirectory=/path/to/tui-homepage
   Restart=always
   User=your_username

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable tui-homepage
   sudo systemctl start tui-homepage
   ```

# What's New in Version 1.2.0

## New Features
- Added a "What's New" section to the README to track version changes
- Restored scrolling animation for long assignment names in the schedule window
- Fixed positioning issues with the main menu when switching between split-screen and full-screen modes
- Improved style management for proper cleanup when exiting menus

## Technical Improvements
- Fixed scrolling text implementation using CSS animations instead of JavaScript
- Improved assignment name display with proper overflow handling
- Text that doesn't fit container now automatically animates for better readability
- Enhanced UI stability when switching between different views

### Troubleshooting

- **Server won't start**: Check that Node.js is installed correctly and all dependencies are installed with `npm install`
- **Cannot connect to server**: Make sure the server is running and you're trying to access the correct port (default: 3001)
- **Canvas integration not working**: Verify your Canvas token is correct and properly set in the `.env` file
- **Schedule not showing correctly**: Check the format of your `schedule-config.json` file
   
## Structure

```text
tui-homepage/
├── public/                  # Static files served to the browser
│   ├── css/                 # Stylesheets
│   │   └── tui-start.css    # Main CSS styling for TUI interface
│   ├── scripts/             # JavaScript files
│   │   ├── tui-start.js     # Main menu initialization
│   │   ├── school-window.js # School menu implementation
│   │   ├── schedule-window.js # Schedule sidebar implementation
│   │   ├── search-window.js # Search interface
│   │   ├── to-do.js         # Task management interface
│   │   ├── canvas-api.js    # Canvas LMS integration helper
│   │   ├── assignment-data.js # Assignment data management
│   │   └── google-autocomplete.js # Search suggestions helper
│   ├── icons/               # SVG icons for menu items
│   ├── config/              # Configuration files
│   │   └── schedule-config.json # Class schedule data
│   └── backgrounds/         # Background animations
│       └── endportal-bg.js  # Terminal background animation
├── server.js                # Node.js server for Canvas API proxy
├── canvas-proxy.js          # Canvas API proxy implementation
└── README.md                # Project documentation
```