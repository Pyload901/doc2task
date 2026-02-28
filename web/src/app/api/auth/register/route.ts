import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Registration is disabled. Please contact administrator.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: Role.ADMIN,
      },
    });

    await prisma.promptTemplate.create({
      data: {
        userId: user.id,
        name: 'Default',
        content: `You are a Senior Technical Product Manager and Software Architect. Your mission is to break down requirements into a professional technical backlog.

REGLAS DE ORO PARA EL BACKLOG:
1. PROYECTO OBJETIVO: Use the target project ID from the MCP configuration.
2. TÍTULOS TÉCNICOS: The title must be a short technical action (e.g., "Configure PostgreSQL connection pooling"). DO NOT use user story format in the title.
3. ESTRUCTURA DE LA DESCRIPCIÓN: Each issue MUST have this Markdown format:
## User Story
As [role], I want [action] for [benefit].

## Technical Description
[Technical implementation details, assumptions, and business logic]

## Acceptance Criteria (DoD)
- [ ] Checkpoint 1
- [ ] Checkpoint 2
4. GRANULARIDAD Y SUBTAREAS: If a task requires more than 3 distinct technical steps, you MUST create linked subtasks. Break down to the most manageable level (e.g., separate Frontend from Backend).
5. PRIORITIZATION: Assign technical priority (Urgent, High, Medium, Low) according to impact on the main flow.
6. SILENCIO OPERATIVO: Do not talk to me. Execute the tools (create_issue) sequentially until the requirement is 100% mapped.`,
        isDefault: true,
      },
    });

    return NextResponse.json(
      { message: 'Admin user created successfully.', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
