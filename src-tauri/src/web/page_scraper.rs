use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapedPage {
    pub url: String,
    pub title: String,
    pub markdown_content: String,
    pub snippet: String,
}

pub struct PageScraper {
    client: reqwest::Client,
}

impl PageScraper {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());

        Self { client }
    }

    /// Fetch and parse a single page into clean Markdown
    pub async fn scrape_url(&self, url: &str) -> Result<ScrapedPage, String> {
        let response = self
            .client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Failed to download URL {}: {}", url, e))?;

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read body: {}", e))?;

        let doc = scraper::Html::parse_document(&html);

        // Extract title
        let title_selector = scraper::Selector::parse("title").unwrap();
        let title = doc
            .select(&title_selector)
            .next()
            .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
            .unwrap_or_else(|| url.to_string());

        // Extract body and strip noisy elements
        let body_selector = scraper::Selector::parse("article, main, body").unwrap();
        let body_elem = doc.select(&body_selector).next();

        let raw_text = if let Some(body) = body_elem {
            body.text().collect::<Vec<_>>().join(" ")
        } else {
            doc.root_element().text().collect::<Vec<_>>().join(" ")
        };

        // Clean up redundant whitespaces
        let cleaned_lines: Vec<&str> = raw_text
            .lines()
            .map(|l| l.trim())
            .filter(|l| !l.is_empty() && l.len() > 20)
            .collect();

        let mut markdown_content = cleaned_lines.join("\n\n");
        if markdown_content.len() > 3000 {
            markdown_content = markdown_content[..3000].to_string() + "\n\n...[content truncated]";
        }

        let snippet = if markdown_content.len() > 200 {
            markdown_content[..200].to_string() + "..."
        } else {
            markdown_content.clone()
        };

        Ok(ScrapedPage {
            url: url.to_string(),
            title,
            markdown_content,
            snippet,
        })
    }

    /// Concurrently scrape multiple URLs and synthesize context for LLM
    pub async fn scrape_and_synthesize(&self, urls: &[String]) -> Vec<ScrapedPage> {
        let mut tasks = Vec::new();

        for url in urls.iter().take(3) {
            let u = url.clone();
            tasks.push(tokio::spawn(async move {
                let scraper = PageScraper::new();
                scraper.scrape_url(&u).await
            }));
        }

        let mut pages = Vec::new();
        for task in tasks {
            if let Ok(Ok(page)) = task.await {
                pages.push(page);
            }
        }

        pages
    }
}
