/**
 * Page Object Model for Landing Page
 * Encapsulates page interactions and selectors
 */

class LandingPage {
  constructor(page) {
    this.page = page;

    // Selectors
    this.heading = page.locator('h1');
    this.workflowSection = page.locator('#workflow');
    this.heroSection = page.locator('section').first();
    this.navigation = page.locator('nav');
    this.allSections = page.locator('section');
    this.allCards = page.locator('[class*="glass"], [class*="card"]');
  }

  /**
   * Navigate to the landing page
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Get the main heading text
   */
  async getHeadingText() {
    return await this.heading.textContent();
  }

  /**
   * Check if workflow section is visible
   */
  async isWorkflowSectionVisible() {
    await this.workflowSection.scrollIntoViewIfNeeded();
    return await this.workflowSection.isVisible();
  }

  /**
   * Get the number of sections on the page
   */
  async getSectionCount() {
    return await this.allSections.count();
  }

  /**
   * Get the background color of an element
   */
  async getBackgroundColor(selector) {
    const element = this.page.locator(selector).first();
    return await element.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
  }

  /**
   * Get the text color of an element
   */
  async getTextColor(selector) {
    const element = this.page.locator(selector).first();
    return await element.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
  }

  /**
   * Check if element has glow effect
   */
  async hasGlowEffect(selector) {
    const element = this.page.locator(selector).first();
    const textShadow = await element.evaluate((el) => {
      return window.getComputedStyle(el).textShadow;
    });
    return textShadow && textShadow !== 'none';
  }

  /**
   * Take a screenshot of the entire page
   */
  async screenshot(filename) {
    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage: true
    });
  }

  /**
   * Get all console messages
   */
  async getConsoleMessages() {
    const messages = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        messages.push({
          type: msg.type(),
          text: msg.text()
        });
      }
    });
    return messages;
  }

  /**
   * Check for accessibility issues
   */
  async checkAccessibility() {
    // Basic accessibility checks
    const headings = await this.page.locator('h1, h2, h3').all();
    const interactiveElements = await this.page.locator('button, a, input').all();

    return {
      hasHeadings: headings.length > 0,
      hasInteractiveElements: interactiveElements.length > 0,
      headingCount: headings.length,
      interactiveCount: interactiveElements.length
    };
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }
}

export default LandingPage;
