# TUI Homepage

A terminal-style new tab page with a schedule-aware school menu and to-do list.

## Features

- Terminal-like interface
- Keyboard navigation (arrow keys and enter)
- School menu with zoom links
- Schedule-aware class selection
- To-do list
- Status bar with current URL
- Animated background

## Setup

1. Clone this repository:
```bash
git clone https://github.com/jkru006/tui-homepage.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your Canvas API token (if using Canvas features):
```
CANVAS_TOKEN=your_token_here
```

4. Start the server:
```bash
npm start
```

5. Open http://localhost:3001 in your browser
   
## Structure

```text
tui-homepage/
├── public/                  # Static files served to the browser
│   ├── css/                 # Stylesheets
│   ├── scripts/             # JavaScript files
│   ├── icons/               # SVG icons
│   └── backgrounds/         # Background animations
├── server.js                # Node.js server for Canvas API proxy
└── schedule-data.json       # Class schedule configuration
```

## Usage

- Use arrow keys (↑/↓) to navigate
- Press Enter to open selected item
- Press Escape to go back
- Status bar shows current URL or context
- School menu shows current/next class based on schedule
