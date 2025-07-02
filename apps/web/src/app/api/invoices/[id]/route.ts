

import { NextRequest, NextResponse } from 'next/server';

import { dbFor } from '@ai-ebilling/db/tenantGuard';
import { InvoiceStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const { id } = await params; // Await params here

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  const db = dbFor(tenantId);
  const invoice = await db.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const invoice = await db.invoice.update({
    where: { id: params.id },
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
    },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  const db = dbFor(tenantId);
  await db.invoice.delete({
    where: { id: params.id },
  });

  return new Response(null, { status: 204 });
}

