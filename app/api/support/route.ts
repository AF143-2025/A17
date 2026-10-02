import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tickets = await db.supportTicket.findMany({
    where: user.role === 'ADMIN' ? {} : { userId: user.id },
    include: {
      user: {
        select: { username: true, email: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { username: true, role: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ticketId, subject, priority, message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'يرجى كتابة نص الرسالة' }, { status: 400 });
    }

    // Replying to an existing ticket
    if (ticketId) {
      const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return NextResponse.json({ error: 'التذكرة غير موجودة' }, { status: 404 });
      }

      if (user.role !== 'ADMIN' && ticket.userId !== user.id) {
        return NextResponse.json({ error: 'غير مصرح لك بالوصول لهذه التذكرة' }, { status: 403 });
      }

      const newStatus = user.role === 'ADMIN' ? 'ANSWERED' : 'PENDING';

      const [newMessage] = await db.$transaction([
        db.supportMessage.create({
          data: {
            ticketId,
            senderId: user.id,
            senderType: user.role,
            message: message.trim(),
          },
        }),
        db.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        }),
      ]);

      // If admin replied, send notification to ticket owner
      if (user.role === 'ADMIN') {
        await db.notification.create({
          data: {
            userId: ticket.userId,
            title: 'رد جديد على تذكرة الدعم',
            message: `قام فريق الدعم بالرد على تذكرتك: ${ticket.subject}`,
            type: 'SUPPORT',
            link: '/support',
          },
        });
      }

      return NextResponse.json({ success: true, message: newMessage });
    }

    // Creating a brand new ticket
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'يرجى إدخال عنوان التذكرة' }, { status: 400 });
    }

    const newTicket = await db.supportTicket.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        messages: {
          create: {
            senderId: user.id,
            senderType: user.role,
            message: message.trim(),
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في إرسال التذكرة' }, { status: 500 });
  }
}
