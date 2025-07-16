# Install BrowserToolsMCP Chrome Extension

## **Step-by-Step Installation**

### **1. Open Chrome Extensions Page**
- Open Chrome/Chromium browser
- Go to: `chrome://extensions/`
- Or click: Menu → More Tools → Extensions

### **2. Enable Developer Mode**
- Toggle "Developer mode" switch in the top-right corner
- This allows loading unpacked extensions

### **3. Load the Extension**
- Click "Load unpacked" button
- Navigate to: `/home/robertspeer/Projects/GitRepo/nearest-nice-weather/chrome-extension/`
- Select the `chrome-extension` folder
- Click "Select Folder"

### **4. Verify Installation**
- You should see "BrowserToolsMCP" in your extensions list
- Make sure it's enabled (toggle switch is blue)
- Pin it to toolbar if desired

### **5. Test the Extension**
- Open a webpage (like your weather app at localhost:3001)
- Open Chrome DevTools (F12)
- Look for "BrowserToolsMCP" tab in DevTools
- If connected, you should see server status

## **Expected Result**
- BrowserToolsMCP panel appears in Chrome DevTools
- Server connection indicator shows "Connected"
- Screenshot functionality becomes available
- Console logs are captured automatically

## **Troubleshooting**

### **Extension Not Appearing**
- Refresh the extensions page
- Check that Developer mode is enabled
- Verify you selected the correct folder

### **Connection Issues**
- Ensure server is running: `curl http://localhost:3025/identity`
- Check server logs for connection attempts
- Try reloading the extension

### **DevTools Panel Missing**
- Close and reopen DevTools
- Refresh the target webpage
- Check extension permissions

## **Current Status**
✅ **Server**: Running and healthy on localhost:3025  
✅ **Extension Files**: Available in chrome-extension/ folder  
❌ **Extension Installation**: Needs to be installed in Chrome  

## **After Installation**
The Dashlane error (`kwift.CHROME.js`) is unrelated and can be ignored. Once BrowserToolsMCP is installed, you'll have:
- Screenshot capture functionality
- Console log monitoring
- Real-time browser activity tracking
- MCP integration with Claude Code