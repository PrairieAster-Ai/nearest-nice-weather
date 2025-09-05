/**
 * ========================================================================
 * FEEDBACK PAGE OBJECT MODEL
 * ========================================================================
 *
 * @PURPOSE: Encapsulates feedback form interactions using semantic locators
 * @FOLLOWS: Playwright best practices for user-facing interactions
 *
 * ========================================================================
 */

import { expect } from '@playwright/test'

export class FeedbackPage {
  constructor(page) {
    this.page = page

    // FEEDBACK FAB AND DIALOG
    this.feedbackButton = page.getByRole('button', { name: /feedback/i })
    this.feedbackDialog = page.getByRole('dialog', { name: /feedback|share your feedback/i })

    // FORM ELEMENTS using semantic locators
    this.ratingStars = page.getByRole('radiogroup', { name: /rate|rating/i })
    this.star1 = page.getByRole('radio', { name: /1 star/i })
    this.star2 = page.getByRole('radio', { name: /2 star/i })
    this.star3 = page.getByRole('radio', { name: /3 star/i })
    this.star4 = page.getByRole('radio', { name: /4 star/i })
    this.star5 = page.getByRole('radio', { name: /5 star/i })

    // CATEGORY BUTTONS
    this.generalCategory = page.getByRole('button', { name: /general/i })
    this.bugCategory = page.getByRole('button', { name: /bug/i })
    this.featureCategory = page.getByRole('button', { name: /feature/i })
    this.performanceCategory = page.getByRole('button', { name: /speed|performance/i })

    // TEXT INPUTS
    this.commentField = page.getByRole('textbox', { name: /feedback|comment/i })
    this.emailField = page.getByRole('textbox', { name: /email/i })

    // FORM ACTIONS
    this.submitButton = page.getByRole('button', { name: /submit/i })
    this.cancelButton = page.getByRole('button', { name: /cancel/i })
    this.closeButton = page.getByRole('button', { name: /close/i })

    // FEEDBACK MESSAGES
    this.successMessage = page.getByRole('alert').filter({ hasText: /thank you|success/i })
    this.errorMessage = page.getByRole('alert').filter({ hasText: /error|failed/i })

    // CHARACTER COUNTER
    this.characterCounter = page.getByText(/\d+\/1000/)
  }

  // NAVIGATION METHODS
  async openFeedback() {
    await this.feedbackButton.click()
    await expect(this.feedbackDialog).toBeVisible()
    return this
  }

  async closeFeedback() {
    await this.cancelButton.click()
    await expect(this.feedbackDialog).toBeHidden()
    return this
  }

  async closeFeedbackWithEscape() {
    await this.page.keyboard.press('Escape')
    await expect(this.feedbackDialog).toBeHidden()
    return this
  }

  // RATING METHODS
  async selectRating(stars) {
    if (stars < 1 || stars > 5) {
      throw new Error('Rating must be between 1 and 5 stars')
    }

    const starMap = {
      1: this.star1,
      2: this.star2,
      3: this.star3,
      4: this.star4,
      5: this.star5
    }

    await starMap[stars].click()
    await expect(starMap[stars]).toBeChecked()

    return this
  }

  // CATEGORY METHODS
  async selectCategory(category) {
    const categoryMap = {
      'general': this.generalCategory,
      'bug': this.bugCategory,
      'feature': this.featureCategory,
      'performance': this.performanceCategory
    }

    const categoryButton = categoryMap[category]
    if (!categoryButton) {
      throw new Error(`Invalid category: ${category}`)
    }

    await categoryButton.click()
    await expect(categoryButton).toHaveAttribute('aria-pressed', 'true')

    return this
  }

  async selectMultipleCategories(categories) {
    for (const category of categories) {
      await this.selectCategory(category)
    }
    return this
  }

  // TEXT INPUT METHODS
  async enterComment(text) {
    await this.commentField.clear()
    await this.commentField.fill(text)

    // Verify character counter updates
    if (text.length > 0) {
      await expect(this.characterCounter).toContainText(text.length.toString())
    }

    return this
  }

  async enterEmail(email) {
    await this.emailField.clear()
    await this.emailField.fill(email)
    return this
  }

  // FORM SUBMISSION METHODS
  async submitFeedback() {
    await this.submitButton.click()
    return this
  }

  async submitCompleteFeedback(feedbackData) {
    const {
      rating = 5,
      categories = ['general'],
      comment = 'Great app!',
      email = ''
    } = feedbackData

    // Fill out form
    await this.selectRating(rating)

    for (const category of categories) {
      await this.selectCategory(category)
    }

    await this.enterComment(comment)

    if (email) {
      await this.enterEmail(email)
    }

    // Submit
    await this.submitFeedback()

    return this
  }

  // ASSERTION METHODS
  async expectDialogVisible() {
    await expect(this.feedbackDialog).toBeVisible()
    return this
  }

  async expectDialogHidden() {
    await expect(this.feedbackDialog).toBeHidden()
    return this
  }

  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible()
    return this
  }

  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible()
    return this
  }

  async expectSubmitButtonDisabled() {
    await expect(this.submitButton).toBeDisabled()
    return this
  }

  async expectSubmitButtonEnabled() {
    await expect(this.submitButton).toBeEnabled()
    return this
  }

  async expectRatingSelected(stars) {
    const starMap = {
      1: this.star1,
      2: this.star2,
      3: this.star3,
      4: this.star4,
      5: this.star5
    }

    await expect(starMap[stars]).toBeChecked()
    return this
  }

  // VALIDATION METHODS
  async validateFormState() {
    const state = {
      dialogVisible: false,
      ratingSelected: null,
      categoriesSelected: [],
      commentLength: 0,
      emailProvided: false,
      submitEnabled: false
    }

    // Check dialog visibility
    state.dialogVisible = await this.feedbackDialog.isVisible()

    if (state.dialogVisible) {
      // Check which rating is selected
      for (let i = 1; i <= 5; i++) {
        const starMap = { 1: this.star1, 2: this.star2, 3: this.star3, 4: this.star4, 5: this.star5 }
        if (await starMap[i].isChecked()) {
          state.ratingSelected = i
          break
        }
      }

      // Check selected categories
      const categoryButtons = [
        { name: 'general', button: this.generalCategory },
        { name: 'bug', button: this.bugCategory },
        { name: 'feature', button: this.featureCategory },
        { name: 'performance', button: this.performanceCategory }
      ]

      for (const cat of categoryButtons) {
        const pressed = await cat.button.getAttribute('aria-pressed')
        if (pressed === 'true') {
          state.categoriesSelected.push(cat.name)
        }
      }

      // Check comment length
      const commentText = await this.commentField.inputValue()
      state.commentLength = commentText.length

      // Check email
      const emailText = await this.emailField.inputValue()
      state.emailProvided = emailText.length > 0

      // Check submit button state
      state.submitEnabled = await this.submitButton.isEnabled()
    }

    return state
  }

  // MOBILE METHODS
  async tapFeedbackButton() {
    await this.feedbackButton.tap()
    await expect(this.feedbackDialog).toBeVisible()
    return this
  }

  async tapSubmitButton() {
    await this.submitButton.tap()
    return this
  }

  // PERFORMANCE METHODS
  async measureFormOpenTime() {
    const startTime = Date.now()
    await this.openFeedback()
    const endTime = Date.now()

    return endTime - startTime
  }

  async measureSubmissionTime(feedbackData) {
    await this.openFeedback()

    const startTime = Date.now()
    await this.submitCompleteFeedback(feedbackData)

    // Wait for success or error message
    try {
      await expect(this.successMessage).toBeVisible({ timeout: 10000 })
    } catch {
      await expect(this.errorMessage).toBeVisible({ timeout: 10000 })
    }

    const endTime = Date.now()
    return endTime - startTime
  }

  // CHARACTER LIMIT TESTING
  async testCharacterLimit() {
    await this.openFeedback()

    const longText = 'x'.repeat(1100) // Exceeds 1000 character limit
    await this.enterComment(longText)

    const actualText = await this.commentField.inputValue()
    return {
      inputLength: longText.length,
      actualLength: actualText.length,
      limitEnforced: actualText.length <= 1000
    }
  }

  // ACCESSIBILITY METHODS
  async testKeyboardNavigation() {
    await this.openFeedback()

    // Tab through form elements
    const tabOrder = []

    // Start with rating
    await this.page.keyboard.press('Tab')
    let focused = await this.page.locator(':focus').getAttribute('aria-label')
    if (focused) tabOrder.push('rating')

    // Continue tabbing through form
    for (let i = 0; i < 10; i++) {
      await this.page.keyboard.press('Tab')
      focused = await this.page.locator(':focus').getAttribute('aria-label') ||
                await this.page.locator(':focus').getAttribute('name')
      if (focused) tabOrder.push(focused)
    }

    return tabOrder
  }

  // EDGE CASE METHODS
  async testEmptySubmission() {
    await this.openFeedback()
    await this.submitFeedback()

    // Should show validation errors or disabled submit
    return {
      submitEnabled: await this.submitButton.isEnabled(),
      errorVisible: await this.errorMessage.isVisible().catch(() => false)
    }
  }

  async testInvalidEmail(invalidEmail) {
    await this.openFeedback()
    await this.selectRating(5)
    await this.enterComment('Test feedback')
    await this.enterEmail(invalidEmail)

    // Check if HTML5 validation kicks in
    const emailValidity = await this.emailField.evaluate(el => el.validity.valid)

    return {
      emailValid: emailValidity,
      submitEnabled: await this.submitButton.isEnabled()
    }
  }
}
