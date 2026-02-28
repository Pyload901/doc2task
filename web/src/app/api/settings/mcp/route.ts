import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mcpConfigs = await prisma.mcpConfig.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(mcpConfigs);
  } catch (error) {
    console.error('Error fetching MCP configs:', error);
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
    const { platform, envVars, isActive } = body;

    if (!platform || !envVars) {
      return NextResponse.json({ error: 'Platform and environment variables are required' }, { status: 400 });
    }

    const config = await prisma.mcpConfig.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform,
        },
      },
      update: {
        envVars,
        isActive: isActive ?? true,
      },
      create: {
        userId: session.user.id,
        platform,
        envVars,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error creating MCP config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, envVars, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    await prisma.mcpConfig.updateMany({
      where: { id, userId: session.user.id },
      data: {
        ...(envVars && { envVars }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ message: 'Config updated' });
  } catch (error) {
    console.error('Error updating MCP config:', error);
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
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
    }

    await prisma.mcpConfig.deleteMany({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: 'Config deleted' });
  } catch (error) {
    console.error('Error deleting MCP config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
