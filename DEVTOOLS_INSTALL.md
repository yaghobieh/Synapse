# 🐙 Synapse DevTools - Quick Installation Guide

## ✅ Prerequisites
- Chrome browser
- Synapse DevTools built (already done ✓)

## 📦 Installation Steps

### 1. Open Chrome Extensions Page
Open Chrome and navigate to:
```
chrome://extensions/
```
Or use the menu: **Menu → Extensions → Manage Extensions**

### 2. Enable Developer Mode
- Look for the **"Developer mode"** toggle in the **top-right corner**
- Click to enable it

### 3. Load the Extension
1. Click the **"Load unpacked"** button (appears after enabling Developer mode)
2. Navigate to:
   ```
   /Users/johnyaghobieh/Desktop/Projects/DomusCore/synapse/devtools
   ```
3. Click **"Select"** to load the extension

### 4. Verify Installation
You should see:
- ✅ **"Synapse DevTools"** in your extensions list
- 🐙 The purple octopus icon
- Version: 1.0.0

## 🎯 Using the DevTools

### 1. Open Your Synapse App
Navigate to your app (e.g., `http://localhost:5173/`)

### 2. Open Chrome DevTools
- Press **F12**, or
- Right-click → **Inspect**, or
- Menu → **More Tools → Developer Tools**

### 3. Find the Synapse Tab
- Look for the **"Synapse"** tab in the DevTools panel
- It should appear alongside Console, Network, etc.

### 4. Check Connection
In the browser console, you should see:
```
✅ Connected to Synapse DevTools
```

## 🔧 Features Available

Once connected, you'll have access to:

### 🔍 Action Panel
- Real-time action logging
- Action payload inspection
- Action filtering by type
- Clear action history

### 📊 State Panel
- Current state tree visualization
- State diff viewer (before/after)
- JSON pretty-printing with syntax highlighting

### 🌐 API Panel
- API call monitoring
- Manual API execution
- Request/response inspection
- Headers and status codes

## ❓ Troubleshooting

### Extension Not Showing Up
1. **Refresh the extensions page** - Click the reload icon on the extension card
2. **Check for errors** - Look in the Chrome console for any error messages
3. **Verify the path** - Make sure you selected the `devtools` folder, not `devtools/dist`

### No "Synapse" Tab in DevTools
1. **Refresh the page** - Reload your Synapse app
2. **Check the console** - Look for "Connected to Synapse DevTools" message
3. **Verify devTools is enabled** - Check your store configuration:
   ```typescript
   createStore(reducer, {
     devTools: true  // ← Make sure this is true
   })
   ```

### Actions Not Appearing
1. **Dispatch some actions** - Use your app to trigger state changes
2. **Check store config** - Ensure you're using Synapse's `createStore`
3. **Look for errors** - Check both page console and DevTools console

## 🎨 Icon Preview

The extension uses a custom octopus icon representing Synapse's neural network-like state management:
- 🐙 8 tentacles = state connections
- 🔮 Purple gradient = Synapse brand
- 🧠 Circuit board style = neural connections

## 📝 Notes

- The extension only works on pages using Synapse
- It's compatible with Redux DevTools as a fallback
- All data stays local - nothing is sent to external servers
- The extension is in development mode (not published to Chrome Web Store)

---

**Need Help?** Check the main DevTools README at:
`/Users/johnyaghobieh/Desktop/Projects/DomusCore/synapse/devtools/README.md`
