import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { doc2md } from '@/lib/doc2md';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const title = formData.get('title') as string;
      const file = formData.get('file') as File | null;

      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      }

      let content = '';

      if (file) {
        const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file type. Allowed: txt, pdf, docx' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Call the doc2md service
        const markdownResult = await doc2md(buffer);
        if (markdownResult.success) {
          content = markdownResult.markdown || '';
        } else {
          return NextResponse.json({ error: 'Failed to convert document to markdown. Probably service not running' }, { status: 500 });
        }
        
        // console.log('Markdown content:', content);
        
        // if (buffer.length > 10 * 1024 * 1024) {
        //   return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 });
        // }

        // const uploadDir = path.join(process.cwd(), 'uploads');
        // await mkdir(uploadDir, { recursive: true });

        // const ext = path.extname(file.name);
        // const filename = `${uuid()}${ext}`;
        // const filepath = path.join(uploadDir, filename);

        // await writeFile(filepath, buffer);
        // content = `/uploads/${filename}`;
      }

      const document = await prisma.document.create({
        data: {
          userId: session.user.id,
          title,
          content,
          type: 'TEXT',
          status: 'PENDING',
        },
      });

      return NextResponse.json(document, { status: 201 });
    } else {
      const body = await request.json();
      const { title, content } = body;

      if (!title || !content) {
        return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
      }

      const document = await prisma.document.create({
        data: {
          userId: session.user.id,
          title,
          content,
          type: 'TEXT',
          status: 'PENDING',
        },
      });

      return NextResponse.json(document, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
