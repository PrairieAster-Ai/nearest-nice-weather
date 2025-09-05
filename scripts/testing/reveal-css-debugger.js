#!/usr/bin/env node

// Debug what CSS is actually being applied to reveal.js elements
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function debugRevealCSS() {
  console.log('🔍 Reveal.js CSS Debugger - Real DOM Analysis');
  console.log('=' . repeat(60));

  // Create HTML page that loads reveal.js and extracts computed styles
  const debugHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>CSS Debug</title>

    <!-- Load reveal.js CSS first -->
    <link rel="stylesheet" href="reveal.js-dist/css/reveal.css">
    <link rel="stylesheet" href="reveal.js-dist/theme/white.css">

    <!-- Load our custom theme -->
    <link rel="stylesheet" href="theme/prairieaster-reveal.css">

    <style>
        /* Force higher specificity override */
        .reveal .slides section.debug-override {
            top: 40px !important;
            padding: 0px 15px 10px 15px !important;
            height: calc(100vh - 45px) !important;
            background: rgba(255, 0, 0, 0.1) !important; /* Red tint to see if applied */
        }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            <section class="debug-override">
                <h2>Debug Section</h2>
                <p>This should have red tint if CSS works</p>
            </section>
        </div>
    </div>

    <script src="reveal.js-dist/dist/reveal.js"></script>
    <script>
        // Initialize reveal.js with our settings
        Reveal.initialize({
            hash: true,
            controls: false,
            progress: false,
            center: false,
            touch: false,
            keyboard: true
        });

        // After initialization, log computed styles
        setTimeout(() => {
            const section = document.querySelector('.reveal .slides section');
            if (section) {
                const computed = window.getComputedStyle(section);

                const debugInfo = {
                    timestamp: new Date().toISOString(),
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        devicePixelRatio: window.devicePixelRatio
                    },
                    section: {
                        top: computed.top,
                        padding: computed.padding,
                        paddingTop: computed.paddingTop,
                        height: computed.height,
                        display: computed.display,
                        justifyContent: computed.justifyContent,
                        flexDirection: computed.flexDirection,
                        position: computed.position,
                        transform: computed.transform,
                        background: computed.background
                    },
                    boundingRect: section.getBoundingClientRect(),
                    classList: Array.from(section.classList),
                    revealCSS: {
                        initialized: typeof Reveal !== 'undefined' && Reveal.isReady(),
                        version: typeof Reveal !== 'undefined' ? Reveal.VERSION : 'unknown'
                    }
                };

                // Write debug info to console and also to a data structure
                console.log('=== COMPUTED STYLES DEBUG ===');
                console.log(JSON.stringify(debugInfo, null, 2));

                // Also write to window for extraction
                window.debugInfo = debugInfo;

                // Add a visible marker
                document.title = 'DEBUG-READY';
            }
        }, 2000);
    </script>
</body>
</html>`;

  // Write debug HTML
  const debugPath = path.join(__dirname, 'apps/web/public/presentation/debug-reveal.html');
  fs.writeFileSync(debugPath, debugHTML);

  console.log('📝 Created debug page: debug-reveal.html');

  // Take screenshot of debug page
  const screenshotPath = path.join(__dirname, 'debug-reveal-screenshot.png');
  const debugUrl = 'http://localhost:3001/presentation/debug-reveal.html';

  console.log('📸 Taking debug screenshot...');

  const command = `flatpak run org.chromium.Chromium --headless --disable-gpu --no-sandbox --window-size=375,812 --virtual-time-budget=3000 --screenshot="${screenshotPath}" "${debugUrl}"`;

  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Debug screenshot failed:', error.message);
        reject(error);
        return;
      }

      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        console.log(`✅ Debug screenshot saved: ${stats.size} bytes`);

        // Try to extract console output
        const extractCommand = `flatpak run org.chromium.Chromium --headless --disable-gpu --no-sandbox --window-size=375,812 --virtual-time-budget=3000 --dump-dom "${debugUrl}" 2>/dev/null | grep "COMPUTED STYLES" || echo "No debug output found"`;

        exec(extractCommand, (extractError, extractStdout) => {
          if (extractStdout && extractStdout.includes('COMPUTED STYLES')) {
            console.log('🎯 Debug output captured:');
            console.log(extractStdout);
          } else {
            console.log('⚠️ No debug console output captured - check screenshot for red tint');
          }

          resolve({
            screenshotPath,
            debugHtmlPath: debugPath,
            size: stats.size
          });
        });
      } else {
        reject(new Error('Debug screenshot file not created'));
      }
    });
  });
}

if (require.main === module) {
  debugRevealCSS()
    .then(result => {
      console.log(`\\n🎯 Debug analysis complete!`);
      console.log(`Screenshot: ${result.screenshotPath}`);
      console.log(`Debug page: ${result.debugHtmlPath}`);
      console.log(`\\n🔍 Check screenshot for:`);
      console.log(`  - Red tint = CSS override working`);
      console.log(`  - No red tint = CSS being overridden`);
      console.log(`  - Layout positioning`);
    })
    .catch(console.error);
}

module.exports = { debugRevealCSS };
