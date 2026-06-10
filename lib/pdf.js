import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function htmlToPdf(html) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    // waitUntil networkidle0 lets any @font-face / inline assets settle.
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return pdf; // Buffer
  } finally {
    await browser.close();
  }
}
