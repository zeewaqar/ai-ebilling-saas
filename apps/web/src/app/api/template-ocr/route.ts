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
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.on("pdfParser_dataError", (errData) => {
          console.error('pdf2json error:', errData.parserError);
          reject(errData.parserError);
        });
        pdfParser.parseBuffer(buffer);
      });
      console.log('Extracted Text for Template OCR:\n', extractedText);
    } catch (pdfError) {
      console.error('Error parsing PDF for Template OCR:', pdfError);
      return NextResponse.json({ error: 'Failed to parse PDF content for template extraction.' }, { status: 422 });
    }

    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    let templateDetails = {};
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes invoice text to identify its structure and key fields. Identify common invoice fields like \"Invoice Number\", \"Date\", \"Bill To\", \"Ship To\", \"Items\" (with sub-fields like \"Description\", \"Quantity\", \"Unit Price\", \"Line Total\"), \"Subtotal\", \"Tax\", \"Total\". For each identified field, provide a suggested JSON key. For line items, describe the array structure and its object properties. Return the data as a JSON object representing the template structure.",
          },
          {
            role: "user",
            content: `Analyze the following invoice text and describe its template structure:\n\n${extractedText}`,
          },
        ],
        model: "llama3-8b-8192", // You can choose a different Groq model if needed
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content;
      console.log('Groq API Raw Response Content for Template OCR:', content);
      if (content && content.trim().length > 0) {
        try {
          templateDetails = JSON.parse(content);
        } catch (jsonError) {
          console.error('Error parsing Groq JSON response for Template OCR:', jsonError);
          console.error('Invalid JSON content:', content);
          return NextResponse.json({ error: 'Invalid JSON response from AI for template.' }, { status: 500 });
        }
      } else {
        console.warn('Groq API returned no content or empty content for template extraction.');
      }
    } catch (groqError) {
      console.error('Error with Groq API call for Template OCR:', groqError);
      return NextResponse.json({ error: 'Failed to extract template details using AI.' }, { status: 500 });
    }

    return NextResponse.json(templateDetails);
  } catch (error) {
    console.error('Unexpected error in Template OCR process:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during template OCR processing.' }, { status: 500 });
  }
}
