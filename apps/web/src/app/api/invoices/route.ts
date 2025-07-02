
import { NextRequest, NextResponse } from 'next/server';

import { dbFor } from '@ai-ebilling/db/tenantGuard';
import { InvoiceStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const sortBy = searchParams.get('sortBy') || 'dueDate';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  const db = dbFor(tenantId);
  const invoices = await db.invoice.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await db.invoice.count({
    where: { tenantId },
  });

  return NextResponse.json({ invoices, total });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  const {
    number,
    invoiceDate,
    dueDate,
    status,
    senderName,
    senderAddress,
    senderEmail,
    senderPhone,
    clientName,
    clientAddress,
    clientEmail,
    clientPhone,
    lineItems,
    subtotal,
    taxAmount,
    totalAmount,
  } = await req.json();

  const db = dbFor(tenantId);
  const invoice = await db.invoice.create({
    data: {
      number,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      status: status.toUpperCase() as InvoiceStatus,
      senderName,
      senderAddress,
      senderEmail,
      senderPhone,
      clientName,
      clientAddress,
      clientEmail,
      clientPhone,
      lineItems: JSON.stringify(lineItems),
      subtotal,
      taxAmount,
      totalAmount,
      tenantId,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}

