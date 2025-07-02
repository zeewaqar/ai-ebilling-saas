
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('invoiceId');

  if (!invoiceId) {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
  }

  let browser;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Declare appUrl here
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Listen for console messages from the page
    page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

    const cookieHeader = req.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split('; ').map(c => {
        const [name, value] = c.split('=');
        return { name, value, domain: new URL(appUrl).hostname };
      });
      await page.setCookie(...cookies);
    }

    // Navigate to the invoice view page
    // IMPORTANT: Replace with your actual application's URL
    await page.goto(`${appUrl}/dashboard/invoices/${invoiceId}/view?pdf=true`, { waitUntil: 'networkidle2', timeout: 60000 });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoiceId}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
