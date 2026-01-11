# Synapse DevTools

Chrome DevTools extension for debugging Synapse state management library.

## Installation

### Option 1: Load from Source (Development)

1. **Build the extension:**
   ```bash
   cd devtools
   npm install
   npm run build
   ```

2. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `devtools` folder (not `dist`)
   - The extension should appear in your extensions list

3. **Verify installation:**
   - Open DevTools on any page (F12 or right-click → Inspect)
   - You should see a "Synapse" tab in the DevTools panel

### Option 2: Load Built Extension

If you just want to use the extension:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `devtools` folder
5. The extension will load with the built JavaScript files

## Features

### 🔍 Action Monitoring
- **Real-time action logging** - See all dispatched actions
- **Action details** - Click any action to view payload and metadata
- **Action filtering** - Filter by action type

### 📊 State Inspection
- **Current state tree** - Visual representation of application state
- **State diff viewer** - See what changed between actions
- **JSON viewer** - Pretty-printed state with syntax highlighting

### 🌐 API Debugging
- **API call monitoring** - Track all HTTP requests made through Synapse
- **Manual API execution** - Send API requests directly from DevTools
- **Request/response inspection** - View headers, status codes, and data

### 🔧 Development Tools
- **Time travel debugging** - Jump to different states (planned)
- **Action replay** - Replay actions to reproduce bugs
- **Performance monitoring** - Track action dispatch timing

## Usage

### Basic Workflow

1. **Open your Synapse app** in Chrome
2. **Open DevTools** (F12)
3. **Click the "Synapse" tab** in DevTools
4. **Start using your app** - actions will appear in real-time

### Action Panel

- **Actions List**: Shows all dispatched actions with timestamps
- **Action Detail**: Click an action to see its payload and metadata
- **Clear Actions**: Remove all logged actions

### State Panel

- **State Tree**: Hierarchical view of current application state
- **Diff View**: Compare state before/after an action

### API Panel

- **API History**: List of all API calls made through Synapse
- **Execute API**: Manually send HTTP requests
  - Method: GET, POST, PUT, DELETE, PATCH
  - URL: Full endpoint URL
  - Action Type: Custom action type for the request
  - Body: JSON payload for POST/PUT requests

## Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run watch
```

### Project Structure

```
devtools/
├── src/                    # TypeScript source files
│   ├── background.ts       # Extension background script
│   ├── content.ts          # Content script for web pages
│   ├── devtools.ts         # DevTools panel creation
│   ├── panel.ts            # Main DevTools panel logic
│   ├── panel.html          # DevTools panel HTML
│   ├── panel.css           # DevTools panel styles
│   └── inject.ts           # Page injection script
├── dist/                   # Compiled JavaScript (auto-generated)
├── public/icons/           # Extension icons
├── manifest.json           # Chrome extension manifest
└── package.json           # Build dependencies
```

### TypeScript Configuration

The extension uses strict TypeScript configuration with:
- ES2020 target
- Chrome extension types (`@types/chrome`)
- Strict type checking
- Source maps for debugging

## Troubleshooting

### Extension Not Loading

1. **Check manifest.json** - Ensure all file paths are correct
2. **Check console** - Look for errors in Chrome DevTools → Extensions
3. **Reload extension** - Click the reload button on the extension card
4. **Restart Chrome** - Sometimes a full restart is needed

### No Actions Appearing

1. **Check connection** - Look for "Connected" status in DevTools
2. **Verify Synapse** - Ensure your app is using Synapse store
3. **Check console** - Look for errors in both page and DevTools consoles

### API Calls Not Showing

1. **Use Synapse API** - Make sure you're using `useQuery`, `useMutation`, or `createApiAction`
2. **Check base URL** - Ensure API base URL is configured correctly

## Contributing

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Make changes** to TypeScript files in `src/`
4. **Build**: `npm run build`
5. **Test**: Load the extension in Chrome and test your changes
6. **Submit PR** with your improvements

## License

MIT © 2026 Synapse Team
