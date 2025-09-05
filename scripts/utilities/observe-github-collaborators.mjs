import { chromium } from 'playwright';

console.log('🔍 Attempting to observe GitHub Collaborators page...');

// First, let's try a simpler approach - take a screenshot of the desktop
try {
  // Launch a browser to take screenshots
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome' // This might work with Brave since it's Chromium-based
  });

  console.log('✅ Browser launched');

  // Create a new page
  const page = await browser.newPage();

  // Navigate to GitHub repository settings
  console.log('Navigating to repository settings...');
  await page.goto('https://github.com/PrairieAster-Ai/nearest-nice-weather/settings/access');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if we need to login
  const loginButton = await page.locator('a[href="/login"]').first();
  if (await loginButton.isVisible()) {
    console.log('❌ Login required - not authenticated');
    await browser.close();
    process.exit(1);
  }

  // Look for collaborators section
  console.log('Looking for collaborators information...');

  // Check the page title
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Look for rhspeer in the collaborators list
  const collaboratorsList = await page.locator('.Box-row').all();
  console.log(`Found ${collaboratorsList.length} potential collaborator entries`);

  // Search for rhspeer
  const rhspeerElement = await page.locator('text=/rhspeer/i').first();
  if (await rhspeerElement.isVisible()) {
    console.log('✅ Found "rhspeer" in the page');

    // Try to find the permission level
    const parentRow = await rhspeerElement.locator('xpath=ancestor::div[contains(@class, "Box-row")]').first();
    const permissionText = await parentRow.locator('text=/Admin|Write|Read|Maintain/i').first();
    if (permissionText) {
      const permission = await permissionText.textContent();
      console.log(`Permission level: ${permission}`);
    }
  } else {
    console.log('❌ "rhspeer" not found on the page');
    console.log('This might mean:');
    console.log('  1. User not added as collaborator yet');
    console.log('  2. Invitation is pending');
    console.log('  3. Page requires authentication');
  }

  // Take a screenshot
  await page.screenshot({ path: 'github-settings-page.png', fullPage: true });
  console.log('📸 Screenshot saved as github-settings-page.png');

  await browser.close();

} catch (error) {
  console.error('Error:', error.message);

  // Alternative: Try to use desktop screenshot
  console.log('\n🖥️ Alternative: Taking desktop screenshot...');

  try {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Use CDP to capture screenshot
    const client = await page.context().newCDPSession(page);
    await client.send('Page.enable');

    console.log('Note: Manual screenshot approach - please ensure GitHub page is visible');

    await browser.close();
  } catch (err) {
    console.log('Could not capture screenshot automatically');
  }

  console.log('\n📋 Manual verification steps:');
  console.log('1. Check if "rhspeer" appears in the Collaborators list');
  console.log('2. Verify the permission level (should be Admin)');
  console.log('3. Check for any pending invitations');
  console.log('4. Ensure the repository is "PrairieAster-Ai/nearest-nice-weather"');
}
