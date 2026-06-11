import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { dirname } from "path";

export async function htmlToPdf(html) {
  const executablePath = await chromium.executablePath();
  console.log("chromium executablePath:", executablePath);

  // @sparticuz/chromium extracts the Chromium binary AND bundled shared libs
  // (libnss3.so, libnspr4.so, etc.) into the same /tmp directory. On Vercel's
  // Amazon Linux 2023 runtime those libs aren't on the system path, so we must
  // tell the dynamic linker where to find them before launching the browser.
  const libDir = dirname(executablePath);
  process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
    ? `${libDir}:${process.env.LD_LIBRARY_PATH}`
    : libDir;

  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath,
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
