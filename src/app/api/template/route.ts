import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/template - Get the active template
export async function GET() {
  try {
    const template = await prisma.template.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/template - Save template (creates new one and sets as active)
export async function PUT(request: NextRequest) {
  let body;
  
  try {
    body = await request.json();
  } catch (parseError) {
    console.error('Error parsing request body:', parseError);
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
  
  try {
    const { subject, body: templateBody } = body;

    // Validate input
    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!templateBody || typeof templateBody !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Body is required' },
        { status: 400 }
      );
    }

    // Check if this exact template already exists (to avoid duplicates)
    const existingTemplate = await prisma.template.findFirst({
      where: { 
        subject,
        body: templateBody,
      },
    });

    let template;

    if (existingTemplate) {
      // Just set this one as active
      await prisma.template.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      
      template = await prisma.template.update({
        where: { id: existingTemplate.id },
        data: { isActive: true },
      });
    } else {
      // Deactivate all existing templates
      await prisma.template.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Create new template
      template = await prisma.template.create({
        data: {
          subject,
          body: templateBody,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Error saving template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to save template: ${errorMessage}` },
      { status: 500 }
    );
  }
}

