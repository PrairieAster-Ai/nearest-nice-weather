const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Connecting to existing Brave browser...');

  try {
    // Connect to existing browser using Chrome DevTools Protocol
    // Brave uses Chromium, so we can connect using chromium
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Connected to browser');

    // Get all contexts (windows/tabs)
    const contexts = browser.contexts();
    console.log(`Found ${contexts.length} context(s)`);

    // Get all pages across all contexts
    let githubPage = null;
    for (const context of contexts) {
      const pages = context.pages();
      console.log(`Context has ${pages.length} page(s)`);

      for (const page of pages) {
        const url = page.url();
        const title = await page.title();
        console.log(`  Page: ${title}`);
        console.log(`  URL: ${url}`);

        // Look for GitHub collaborators page
        if (url.includes('github.com') && (url.includes('settings/access') || url.includes('collaborators'))) {
          githubPage = page;
          console.log('  ✅ Found GitHub Collaborators page!');
        }
      }
    }

    if (githubPage) {
      console.log('\n📊 Analyzing GitHub Collaborators page...\n');

      // Get the current URL
      const currentUrl = githubPage.url();
      console.log(`Current URL: ${currentUrl}`);

      // Extract repository information from URL
      const urlParts = currentUrl.split('/');
      if (urlParts.includes('settings')) {
        const repoIndex = urlParts.indexOf('github.com') + 1;
        const owner = urlParts[repoIndex];
        const repo = urlParts[repoIndex + 1];
        console.log(`Repository: ${owner}/${repo}`);
      }

      // Check for collaborators section
      try {
        // Look for collaborators heading
        const collaboratorsSection = await githubPage.locator('h2:has-text("Manage access"), h2:has-text("Collaborators"), h3:has-text("Direct access")').first();
        if (collaboratorsSection) {
          console.log('\n✅ Collaborators section found');
        }

        // Look for user entries
        const userEntries = await githubPage.locator('[data-testid="collaborator-item"], .Box-row:has(.avatar)').all();
        console.log(`\nFound ${userEntries.length} collaborator entries`);

        // Try to find rhspeer user
        const rhspeerEntry = await githubPage.locator('text=/rhspeer/i').first();
        if (await rhspeerEntry.isVisible()) {
          console.log('✅ User "rhspeer" found in collaborators list');

          // Check permission level
          const permissionElement = await githubPage.locator('text=/rhspeer/i').locator('..').locator('text=/admin|write|read|maintain/i').first();
          if (permissionElement) {
            const permission = await permissionElement.textContent();
            console.log(`  Permission level: ${permission}`);
          }
        } else {
          console.log('❌ User "rhspeer" not found in visible collaborators');
        }

        // Check for pending invitations
        const pendingSection = await githubPage.locator('text=/pending/i').first();
        if (await pendingSection.isVisible()) {
          console.log('\n⚠️ There are pending invitations');
        }

        // Check organization teams if visible
        const teamsSection = await githubPage.locator('text=/teams/i').first();
        if (await teamsSection.isVisible()) {
          console.log('\n📋 Teams section is visible');
        }

      } catch (error) {
        console.log('Note: Some elements might not be visible or loaded');
      }

      // Take a screenshot for reference
      await githubPage.screenshot({ path: 'github-collaborators-page.png' });
      console.log('\n📸 Screenshot saved as github-collaborators-page.png');

    } else {
      console.log('\n❌ GitHub Collaborators page not found in open tabs');
      console.log('Please navigate to: Settings → Manage access (Collaborators)');
    }

    await browser.close();

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n💡 To enable browser connection:');
    console.log('1. Close Brave completely');
    console.log('2. Restart Brave with: brave --remote-debugging-port=9222');
    console.log('3. Navigate to the GitHub Collaborators page');
    console.log('4. Run this script again');
  }
})();
