import puppeteer from "puppeteer";

async function scrapeWebsite(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  const data = await page.evaluate(() => {
    const metaTags = Array.from(document.querySelectorAll("meta")).map((m) => ({
      name: m.getAttribute("name") || m.getAttribute("property"),
      content: m.getAttribute("content"),
    }));

    const headers = {};
    ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
      headers[tag] = Array.from(document.querySelectorAll(tag)).map(
        (h) => h.textContent?.trim() || ""
      );
    });

    const canonical =
      document.querySelector("link[rel='canonical']")?.getAttribute("href") ||
      null;

    const links = Array.from(document.querySelectorAll("a")).map((a) => ({
      href: a.href,
      text: a.textContent?.trim() || "",
      rel: a.rel || "",
    }));

    const scripts = Array.from(document.querySelectorAll("script")).map(
      (s) => ({
        src: s.getAttribute("src"),
        type: s.getAttribute("type"),
        jsonLD: s.type === "application/ld+json" ? s.textContent?.trim() : null,
      })
    );

    const bodyText = document.body.innerText || "";
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    return {
      title: document.title,
      metaTags,
      headers,
      canonical,
      links,
      scripts,
      wordCount,
      bodyText: bodyText.slice(0, 7000),
    };
  });

  await browser.close();
  return data;
}

// Usage example
(async () => {
  console.log("Collecting information");
  const result = await scrapeWebsite("https://codepaper.com");
  console.log(JSON.stringify(result));
  // // pass to llm
  // const dataAnalyzed = await analyzeScrapedData(JSON.stringify(result));
  // console.log(dataAnalyzed);
  // // find competitors
  // const competitors = await findCompetitors(JSON.stringify(dataAnalyzed));
  // console.log(competitors);
})();
