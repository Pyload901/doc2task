import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        provider: true,
        createdAt: true,
      },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'USER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, apiKey, provider } = body;

    if (!name || !apiKey || !provider) {
      return NextResponse.json({ error: 'Name, API key, and provider are required' }, { status: 400 });
    }

    const encryptedKey = encrypt(apiKey);

    const apiKeyRecord = await prisma.apiKey.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
      update: {
        name,
        encryptedKey,
      },
      create: {
        userId: session.user.id,
        name,
        encryptedKey,
        provider,
      },
    });

    return NextResponse.json({
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      provider: apiKeyRecord.provider,
      createdAt: apiKeyRecord.createdAt,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    await prisma.apiKey.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: 'API key deleted' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
