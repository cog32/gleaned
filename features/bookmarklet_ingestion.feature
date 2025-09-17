Feature: Bookmarklet Article Ingestion
  As a user
  I want to use a bookmarklet to quickly extract articles from any website
  So that I can speed read content from across the web

  Background:
    Given the Gleaned service worker is active
    And I have the bookmarklet installed in my browser

  Scenario: Bookmarklet extraction and ingestion
    Given I am reading an article on "https://news.com/breaking-story"
    When I click the Gleaned bookmarklet
    Then the article content should be extracted from the page
    And I should be redirected to the ingest page
    And the article should be processed and cleaned
    And I should see a preview of the cleaned content

  Scenario: Ingest page processing
    Given I have used the bookmarklet to extract an article
    When I arrive at the ingest page
    Then I should see "Processing Content..." status
    And the article should be cleaned using content extraction
    And ads and navigation should be removed
    And reading time should be calculated
    And I should see "Content Ready!" when processing is complete

  Scenario: Multiple ingestion sources
    Given I use the bookmarklet on different websites
    When I extract articles from "news.com" and "blog.com"
    Then each article should be stored with a unique ID
    And no article should overwrite another
    And I should be able to read any previously ingested article

  Scenario: Start reading from ingest page
    Given I have successfully processed an article via bookmarklet
    When I click "Start Reading"
    Then the article should be stored with a unique identifier
    And I should navigate to the reading page
    And the RSVP reading should begin with the ingested article

  Scenario: View full article from ingest page  
    Given I have successfully processed an article via bookmarklet
    When I click "View Article"
    Then the article should be stored with a unique identifier
    And I should navigate to the main page in view mode
    And I should see the full cleaned article content