# TUI Homepage

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
- Class-specific resource integration (Zoom links, LMS access)

## Setup Guide

This guide will walk you through setting up the TUI Homepage from scratch, including installing all prerequisites.

### Prerequisites Installation

#### For Linux (Ubuntu/Debian)

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

#### For macOS

1. Install Homebrew (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Git:
   ```bash
   brew install git
   ```

3. Install Node.js and npm:
   ```bash
   brew install node
   ```

4. Verify installations:
   ```bash
   git --version
   node --version
   npm --version
   ```

#### For Windows

1. Download and install Git from [git-scm.com](https://git-scm.com/download/win)
   - During installation, select "Use Git from the Windows Command Prompt"
   - Other options can remain at their defaults

2. Download and install Node.js from [nodejs.org](https://nodejs.org/)
   - Download the LTS version recommended for most users
   - The installer will also install npm

3. Verify installations (open Command Prompt):
   ```cmd
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
   # Linux/macOS
   echo "CANVAS_TOKEN=your_token_here" > .env
   
   # Windows (Command Prompt)
   echo CANVAS_TOKEN=your_token_here > .env
   ```
   
   Replace `your_token_here` with your actual Canvas API token. 
   
   To get your Canvas token:
   1. Log into Canvas
   2. Go to Account > Settings
   3. Scroll down to "Approved Integrations"
   4. Click "New Access Token"
   5. Give it a name and expiration date
   6. Copy the token (you won't be able to see it again)

5. Configure your class schedule in `public/config/schedule-config.json`:
   - Edit the file to match your personal class schedule
   - Format is organized by day of the week
   - Each class needs a time range and subject

6. Start the server:
   ```bash
   npm start
   ```

7. Open http://localhost:3001 in your browser

### Setting as Homepage or New Tab Page

#### Firefox

1. Open Firefox and go to Preferences/Options
2. Under Home Page, enter: `http://localhost:3001`
3. To set as New Tab page:
   - Install the "New Tab Override" extension
   - Configure it to use `http://localhost:3001`

#### Chrome

1. Open Chrome and go to Settings
2. Under "On startup", select "Open a specific page or set of pages"
3. Add `http://localhost:3001`
4. To set as New Tab page:
   - Install the "New Tab Redirect" extension
   - Configure it to use `http://localhost:3001`

#### Edge

1. Open Edge and go to Settings
2. Under "Start, home, and new tabs"
3. Set your homepage to `http://localhost:3001`
4. For new tabs, install the "Custom New Tab URL" extension

### Running as a Service (Auto-start)

#### Linux (systemd)

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

#### macOS (launchd)

1. Create a launch agent file:
   ```bash
   nano ~/Library/LaunchAgents/com.user.tui-homepage.plist
   ```

2. Add the following content (update paths as needed):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>Label</key>
     <string>com.user.tui-homepage</string>
     <key>ProgramArguments</key>
     <array>
       <string>/usr/local/bin/node</string>
       <string>/path/to/tui-homepage/server.js</string>
     </array>
     <key>RunAtLoad</key>
     <true/>
     <key>KeepAlive</key>
     <true/>
     <key>WorkingDirectory</key>
     <string>/path/to/tui-homepage</string>
   </dict>
   </plist>
   ```

3. Load the agent:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.user.tui-homepage.plist
   ```

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Name it "TUI Homepage" and click Next
4. Trigger: "When the computer starts" and click Next
5. Action: "Start a program" and click Next
6. Program/script: Path to Node.js executable (usually `C:\Program Files\nodejs\node.exe`)
7. Arguments: Path to server.js (e.g., `C:\path\to\tui-homepage\server.js`)
8. Start in: Path to project folder (e.g., `C:\path\to\tui-homepage`)
9. Click Next and Finish

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
│   │   └── google-autocomplete.js # Search suggestions helper
│   ├── icons/               # SVG icons for menu items
│   ├── config/              # Configuration files
│   │   └── schedule-config.json # Class schedule data
│   └── backgrounds/         # Background animations
├── backgrounds/             # Background source code
│   └── endportal-bg.js      # Terminal background animation
├── docs/                    # Documentation
│   ├── backgrounds.md       # Background animation system documentation
│   ├── canvas-integration.md # Canvas LMS integration documentation
│   ├── schedule-window.md   # Schedule sidebar implementation details
│   ├── school-window.md     # School menu implementation details
│   ├── search-window.md     # Search window implementation details
│   └── to-do-list.md       # To-Do list implementation details
├── server.js                # Node.js server for Canvas API proxy
├── canvas-proxy.js          # Canvas API proxy implementation
└── README.md                # Project documentation
```

## Usage

### Navigation
- Use arrow keys (↑/↓) to navigate through menu items
- Press Enter to select/open the highlighted option
- Press Escape to return to the previous menu
- Start typing to instantly open the search window
- Status bar always shows the current URL or context

### Main Menu
- Quick access to common websites and tools
- Select "Search" to open the multi-engine search window
- Select "School" to access class-specific resources

### School Menu
- Automatically highlights your current or next class based on schedule
- Displays all class links with proper icons and styling
- Shows a schedule sidebar with today's timetable
- When school day is over, highlights the last period of the day
- Displays upcoming coursework for the selected class
- "To-Do List" option for managing assignments

### Search Window
- Multiple search engine support (Google, DuckDuckGo, YouTube, etc.)
- Real-time URL preview in status bar
- Keyboard navigation between engines
- Instant search initiation

## Customization

### Adding New Menu Items

1. To add items to the main menu, edit `public/scripts/tui-start.js`:
   - Find the `menuItems` array
   - Add a new object with `label`, `url`, and `icon` properties

2. To add items to the school menu, edit `public/scripts/school-window.js`:
   - Find the `subjects` array
   - Add a new object with `label`, `url`, and `icon` properties

### Changing the Background

1. The animated background is controlled by `backgrounds/endportal-bg.js`
2. You can customize colors, animation speed, and density in this file
3. To use a completely different background:
   - Create a new background script in the `backgrounds` directory
   - Update the reference in `public/index.html`

### Styling Modifications

1. Main styling is defined in `public/css/tui-start.css`
2. Key elements you can customize:
   - Color scheme (background, text, highlight colors)
   - Box dimensions and borders
   - Font family and sizes
   - Animation effects
   - Status bar appearance

### Schedule Configuration

1. Edit `public/config/schedule-config.json` to match your personal schedule
2. Format:
   ```json
   {
     "Monday": [
       { "time": "9:00-10:30am", "subject": "Mathematics" },
       { "time": "10:45-12:15pm", "subject": "History" }
     ],
     "Tuesday": [
       ...
     ]
   }
   ```

## Documentation

Detailed implementation documentation is available for various components:

- [School Window](docs/school-window.md) - Implementation of the School Menu interface
- [Schedule Window](docs/schedule-window.md) - Schedule sidebar and class tracking
- [Search Window](docs/search-window.md) - Multi-engine search interface
- [To-Do List](docs/to-do-list.md) - Task management system
- [Canvas Integration](docs/canvas-integration.md) - Canvas LMS API integration details
- [Background Animation](docs/backgrounds.md) - WebGL-powered background system