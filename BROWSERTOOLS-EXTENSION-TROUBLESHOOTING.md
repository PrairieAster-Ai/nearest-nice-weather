# BrowserToolsMCP Extension Troubleshooting

## **Current Status**
✅ **Extension Installed**: BrowserToolsMCP is installed and enabled in Chrome  
✅ **Server Running**: BrowserToolsMCP server is healthy on localhost:3025  
✅ **Endpoint Fix Applied**: Extension now uses correct `/identity` endpoint (was `/.identity`)  
🔄 **Connection Status**: Extension needs reload to apply endpoint fix  

## **Troubleshooting Steps**

### **Step 1: Reload the Extension**
Since the server was restarted, the extension needs to be reloaded:

1. Go to `chrome://extensions/`
2. Find "BrowserToolsMCP" extension
3. Click the **🔄 Reload** button (circular arrow icon)
4. The extension will restart with fresh connection

### **Step 2: Test Connection**
1. Open the test page: `file:///home/robertspeer/Projects/GitRepo/nearest-nice-weather/test-extension-connection.html`
2. Click "Test Direct Server Connection" - should show ✅ success
3. Check for any connection errors

### **Step 3: Check Extension Console**
1. Go to `chrome://extensions/`
2. Find "BrowserToolsMCP" extension
3. Click **"Inspect views: background page"**
4. Look for connection logs or errors in the console

### **Step 4: Test in DevTools**
1. Open your weather app: `http://localhost:3001`
2. Open Chrome DevTools (F12)
3. Look for **"BrowserToolsMCP"** tab in DevTools
4. If missing, the extension isn't connecting

### **Step 5: Clear Extension Storage**
The extension might have cached old settings:

1. Go to `chrome://extensions/`
2. Click **"Inspect views: background page"** for BrowserToolsMCP
3. In the console, run:
   ```javascript
   chrome.storage.local.clear();
   console.log('Extension storage cleared');
   ```
4. Reload the extension

### **Step 6: Check Server Logs**
The server logs show connection attempts:
```bash
# Watch server logs for connection attempts
tail -f /tmp/browsertools-server.log
```

Look for lines like:
- `GET /identity` - Extension checking server
- `POST /current-url` - Extension sending URL updates
- `GET /health` - Extension health checks

## **Expected Behavior**

### **When Working Correctly:**
1. **Extension Console**: Shows "Connected to BrowserToolsMCP server"
2. **DevTools**: Shows "BrowserToolsMCP" tab/panel
3. **Server Logs**: Shows periodic `/identity` requests
4. **Test Page**: Direct connection test passes

### **Common Issues:**

#### **Extension Not Connecting**
- **Symptom**: No BrowserToolsMCP panel in DevTools
- **Solution**: Reload extension, clear storage, test connection

#### **Server Connection Refused**
- **Symptom**: Connection errors in extension console
- **Solution**: Verify server is running, check port 3025

#### **Wrong Port/Host**
- **Symptom**: Extension tries wrong server address
- **Solution**: Clear extension storage, should default to localhost:3025

## **Manual Connection Test**

Run this in the BrowserToolsMCP extension console:
```javascript
// Test server connection manually
fetch('http://localhost:3025/identity')
  .then(r => r.json())
  .then(data => {
    console.log('Server response:', data);
    if (data.signature === 'mcp-browser-connector-24x7') {
      console.log('✅ Server connection successful!');
    } else {
      console.log('❌ Wrong server signature:', data.signature);
    }
  })
  .catch(err => {
    console.error('❌ Connection failed:', err);
  });
```

## **Reset Instructions**

If nothing works, complete reset:

1. **Disable extension**: Turn off BrowserToolsMCP in chrome://extensions/
2. **Clear storage**: Use inspect views → console → `chrome.storage.local.clear()`
3. **Restart server**: `./scripts/browsertools-monitor.sh restart`
4. **Enable extension**: Turn BrowserToolsMCP back on
5. **Test connection**: Use the test page

## **Server Verification**

Confirm server is working:
```bash
# Test server endpoints
curl http://localhost:3025/identity
curl http://localhost:3025/health
```

Both should return JSON responses with no errors.

## **Next Steps**

1. **Start with Step 1**: Reload the extension
2. **Use the test page**: Open test-extension-connection.html
3. **Check extension console**: Look for connection logs
4. **Report findings**: What do you see in the extension console?