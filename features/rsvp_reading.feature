Feature: RSVP Reading Experience
  As a user
  I want to speed read articles using RSVP (Rapid Serial Visual Presentation)
  So that I can read faster with better comprehension

  Background:
    Given I have loaded an article
    And I am on the reading page

  Scenario: RSVP display settings
    Then words should be centered on screen at a fixed position
    And the default reading speed should be 250 WPM
    And the text should use high-contrast serif or sans-serif font
    And the font size should be large for legibility
    And longer words should get extended display time

  Scenario: Minimal speed controls
    Then I should see a "Faster" button
    And I should see a "Slower" button  
    And I should see a "Back" button in the header
    And advanced controls should be hidden by default

  Scenario: Speed adjustment range
    Given I am reading at 250 WPM
    When I click "Faster" multiple times
    Then the speed should increase up to 600 WPM maximum
    When I click "Slower" multiple times
    Then the speed should decrease down to 150 WPM minimum

  Scenario: Comprehension features - sentence pauses
    Given I am reading text with sentences
    When a sentence ends with punctuation
    Then there should be a brief pause of 100-200ms
    And the reading should continue smoothly

  Scenario: Comprehension features - paragraph pauses
    Given I am reading text with paragraphs
    When a paragraph break occurs
    Then there should be an extended pause of 300-500ms
    And the reading rhythm should respect paragraph structure

  Scenario: Session time limits
    Given I have been reading for 20 minutes
    Then the session should auto-pause
    And I should see a message about maintaining focus
    And I should be able to resume reading

  Scenario: Debug mode (optional advanced features)
    Given debug mode is enabled
    Then I should see a start/pause button
    And I should see progress indicators and session stats
    And I should see ORP highlighting options
    And I should see word info and context display
    And I should have option to replay last sentence