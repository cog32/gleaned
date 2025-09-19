Feature: Main Page Interface
  As a user
  I want a minimalist zen UI with clean article display
  So that I can focus on reading without distractions

  Background:
    Given I am on the main page

  Scenario: Minimalist UI design
    Then I should see a clean, minimal interface
    And the UI should prefer icons over text
    And the background should be white for reading focus

  Scenario: Article URL input and loading
    When I enter a valid article URL "https://example.com/article"
    And I click the load button
    Then the article content should be extracted and cleaned
    And I should see the article title, author, and reading time
    And ads and navigation elements should be removed
    And the content should have a clean white background

  Scenario: Reading time calculation
    Given I have loaded an article with 1250 words
    When the reading time is calculated at 250 WPM
    Then I should see "5MIN" reading time displayed
    And the reading time should update based on word count

  Scenario: Play button navigation
    Given I have successfully loaded an article
    When I see the article preview
    Then the play button should be enabled
    When I click the play button
    Then I should navigate to the reading page

  Scenario: Content cleaning and display
    Given I load an article with ads and navigation
    When the content is processed
    Then I should only see the article title and main content
    And images should be preserved and displayed cleanly
    And no advertisements or sidebar content should appear