#!/usr/bin/env node

// Capture race condition by taking screenshots at different timing intervals
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function takeTimedScreenshot(delay, filename) {
  console.log(`📸 Taking screenshot after ${delay}ms...`);

  const screenshotPath = path.join(__dirname, filename);
  const url = 'http://localhost:3001/presentation/index-reveal.html';

  // Create a temporary HTML file that waits before taking screenshot
  const tempHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Timed Redirect</title>
</head>
<body>
    <script>
        setTimeout(function() {
            window.location.href = '${url}';
        }, ${delay});
    </script>
    <div style="text-align:center; padding:20px;">
        Loading in ${delay}ms...
    </div>
</body>
</html>`;

  const tempPath = path.join(__dirname, `temp-${delay}.html`);
  fs.writeFileSync(tempPath, tempHtml);

  // Take screenshot after the delay
  const command = `flatpak run org.chromium.Chromium --headless --disable-gpu --no-sandbox --window-size=375,812 --virtual-time-budget=${delay + 2000} --screenshot="${screenshotPath}" "file://${tempPath}"`;

  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch (e) {}

      if (error) {
        console.error(`❌ Screenshot ${delay}ms failed:`, error.message);
        reject(error);
        return;
      }

      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        console.log(`✅ Screenshot ${delay}ms saved: ${stats.size} bytes`);
        resolve(screenshotPath);
      } else {
        reject(new Error(`Screenshot ${delay}ms file not created`));
      }
    });
  });
}

async function takeDirectScreenshot(waitTime, filename) {
  console.log(`📸 Taking direct screenshot with ${waitTime}ms wait...`);

  const screenshotPath = path.join(__dirname, filename);
  const url = 'http://localhost:3001/presentation/index-reveal.html';

  // Use --run-all-compositor-stages-before-draw to ensure page is fully rendered
  const command = `flatpak run org.chromium.Chromium --headless --disable-gpu --no-sandbox --window-size=375,812 --run-all-compositor-stages-before-draw --virtual-time-budget=${waitTime} --screenshot="${screenshotPath}" "${url}"`;

  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Direct screenshot ${waitTime}ms failed:`, error.message);
        reject(error);
        return;
      }

      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        console.log(`✅ Direct screenshot ${waitTime}ms saved: ${stats.size} bytes`);
        resolve(screenshotPath);
      } else {
        reject(new Error(`Direct screenshot ${waitTime}ms file not created`));
      }
    });
  });
}

async function captureRaceCondition() {
  console.log('🏁 Race Condition Capture - Multiple Timing Screenshots');
  console.log('=' . repeat(60));

  const screenshots = [];

  try {
    // Take screenshots at different intervals to catch the race condition
    const timings = [
      { delay: 0, name: 'immediate.png' },
      { delay: 500, name: 'half-second.png' },
      { delay: 1000, name: 'one-second.png' },
      { delay: 2000, name: 'two-seconds.png' },
      { delay: 3000, name: 'three-seconds.png' }
    ];

    console.log('\n📊 Taking screenshots at different timings...');

    for (const timing of timings) {
      try {
        const result = await takeDirectScreenshot(timing.delay, timing.name);
        screenshots.push({ timing: timing.delay, path: result, size: fs.statSync(result).size });
      } catch (error) {
        console.log(`⚠️ Failed ${timing.delay}ms: ${error.message}`);
        screenshots.push({ timing: timing.delay, path: null, error: error.message });
      }

      // Small delay between screenshots
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Results Summary:');
    screenshots.forEach(shot => {
      if (shot.path) {
        console.log(`${shot.timing}ms: ✅ ${Math.round(shot.size/1024)}KB - ${shot.path}`);
      } else {
        console.log(`${shot.timing}ms: ❌ ${shot.error}`);
      }
    });

    console.log('\n🔍 Analysis:');
    console.log('Look for differences in file sizes and visual content');
    console.log('If race condition exists, you should see:');
    console.log('  - Early screenshots: Good layout (larger file size)');
    console.log('  - Later screenshots: Broken layout (smaller file size)');

    // Check for size variations that might indicate layout changes
    const validShots = screenshots.filter(s => s.path && s.size);
    if (validShots.length > 1) {
      const sizes = validShots.map(s => s.size);
      const minSize = Math.min(...sizes);
      const maxSize = Math.max(...sizes);
      const sizeVariation = ((maxSize - minSize) / minSize * 100).toFixed(1);

      console.log(`\n📈 Size Variation: ${sizeVariation}% (${minSize} to ${maxSize} bytes)`);

      if (sizeVariation > 20) {
        console.log('🎯 SIGNIFICANT SIZE VARIATION DETECTED - Likely race condition!');
      } else {
        console.log('📊 Consistent sizes - Layout appears stable');
      }
    }

    return screenshots;

  } catch (error) {
    console.error('❌ Race condition capture failed:', error);
    return [];
  }
}

if (require.main === module) {
  captureRaceCondition()
    .then(results => {
      console.log('\n🎯 Race condition capture complete!');
      console.log(`Captured ${results.filter(r => r.path).length} screenshots`);
    })
    .catch(console.error);
}

module.exports = { captureRaceCondition, takeDirectScreenshot };
