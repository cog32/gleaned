Feature: Progress Bar Seeking
  As a reader
  I want to drag the progress bar to seek
  So that I can jump to any position in the article

  Background:
    Given I have a processed article with 200 words

  Scenario: Seek to middle of article
    When I seek to 50 percent on the progress bar
    Then the current word index should be near 100

  Scenario: Seek to beginning and end
    When I seek to 0 percent on the progress bar
    Then the current word index should be 0
    When I seek to 100 percent on the progress bar
    Then the current word index should be 199

  Scenario: Seeking does not change play/pause state
    Given reading is paused
    When I seek to 25 percent on the progress bar
    Then reading should remain paused
    Given reading is playing
    When I seek to 75 percent on the progress bar
    Then reading should remain playing

