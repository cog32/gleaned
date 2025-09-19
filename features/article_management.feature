Feature: Article Management
  As a user
  I want each article to have a unique identifier
  So that I can load multiple articles without data conflicts

  Background:
    Given I am on the main page

  Scenario: Each article gets a unique ID
    When I load an article from "https://example.com/article1"
    Then the article should be stored with a unique identifier
    And the article identifier should follow the pattern "article-{articleId}"

  Scenario: Multiple articles can be loaded without conflicts
    Given I have loaded an article from "https://example.com/article1" 
    When I load another article from "https://example.com/article2"
    Then both articles should be stored separately
    And each article should retain its original content
    And the selected article should be tracked independently

  Scenario: Bookmarklet articles are stored with unique IDs
    Given I use the bookmarklet on "https://news.com/story1"
    When I use the bookmarklet on "https://blog.com/story2"  
    Then each bookmarklet article should be stored separately
    And I should be able to read either article without conflicts

  Scenario: Selected article tracking
    Given I have multiple articles stored
    When I select an article to read
    Then the selectedArticleId should be updated
    And the reading page should load the correct article
    And other stored articles should remain unaffected