import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import PDFParser from 'pdf2json';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      console.error('No file uploaded.');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set.');
      return NextResponse.json({ error: 'Server configuration error: GROQ_API_KEY is missing.' }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';
    try {
      extractedText = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(1);
        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          let textContent = '';
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            pdfData.Pages.forEach((page) => {
              if (page.Texts) {
                page.Texts.forEach((text) => {
                  if (text.R) {
                    text.R.forEach((run) => {
                      textContent += decodeURIComponent(run.T);
                    });
                  }
                });
              }
            });
          }
          resolve(textContent);
        });
        pdfParser.on("pdfParser_dataError", (errData) => {
          console.error('pdf2json error:', errData.parserError);
          reject(errData.parserError);
        });
        pdfParser.parseBuffer(buffer);
      });
      console.log('Extracted Text from PDF:', extractedText); // Log extracted text
    } catch (pdfError) {
      console.error('Error parsing PDF:', pdfError);
      return NextResponse.json({ error: 'Failed to parse PDF content.' }, { status: 422 });
    }

    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    let invoiceDetails = {};
    try {
      const messages = [
        {
          role: "system",
          content: "You are an AI assistant that extracts all possible invoice details from text. Extract the invoice number, invoice date (YYYY-MM-DD), due date (YYYY-MM-DD), status (DRAFT, SENT, PAID, VOID). Also extract sender details (name, address, email, phone) and client details (name, address, email, phone). Identify line items, each with a description, quantity, and unit price. Finally, extract subtotal, tax amount, and total amount. If a field is not found, return null for that field. For line items, return an array of objects. Return the data as a JSON object.",
        },
        {
          role: "user",
          content: `Extract invoice details from the following text:\n\n${extractedText}`,
        },
      ];
      console.log('Messages sent to Groq API:', JSON.stringify(messages, null, 2)); // Log Groq input

      const chatCompletion = await groq.chat.completions.create({
        messages: messages,
        model: "llama3-8b-8192", // You can choose a different Groq model if needed
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      console.log('Groq API Raw Response Content:', content); // Log raw Groq response
      if (content && content.trim().length > 0) {
        try {
          invoiceDetails = JSON.parse(content);
        } catch (jsonError) {
          console.error('Error parsing Groq JSON response:', jsonError);
          console.error('Invalid JSON content:', content);
          return NextResponse.json({ error: 'Invalid JSON response from AI.' }, { status: 500 });
        }
      } else {
        console.warn('Groq API returned no content or empty content for invoice extraction.');
      }
    } catch (groqError) {
      console.error('Error with Groq API call:', groqError);
      return NextResponse.json({ error: 'Failed to extract details using AI.' }, { status: 500 });
    }

    return NextResponse.json(invoiceDetails);
  } catch (error) {
    console.error('Unexpected error in OCR process:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during OCR processing.' }, { status: 500 });
  }
}


