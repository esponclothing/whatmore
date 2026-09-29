import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, isOwnerAuthenticated } from '@/lib/authSession';

// GET: Fetch pending/approved/rejected entries for review dashboard
export async function GET(req: NextRequest) {
  try {
    const isOwner = isOwnerAuthenticated(req);
    const user = await getAuthenticatedUser(req);
    if (!isOwner && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || user?.clientId || null;
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Owner without clientId can see all entries across all clients
    const whereBase = clientId ? { clientId } : {};

    const [entries, total, stats] = await Promise.all([
      prisma.silentListenerEntry.findMany({
        where: { ...whereBase, status },
        orderBy: { overallScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.silentListenerEntry.count({ where: { ...whereBase, status } }),
      prisma.silentListenerEntry.groupBy({
        by: ['status'],
        where: whereBase,
        _count: { status: true },
      }),
    ]);

    const statusCounts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      INJECTED: 0,
    };
    stats.forEach((s) => {
      if (s.status in statusCounts) {
        statusCounts[s.status as keyof typeof statusCounts] = s._count.status;
      }
    });

    return NextResponse.json({
      success: true,
      entries,
      total,
      page,
      pages: Math.ceil(total / limit),
      statusCounts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Approve, Reject, or Inject an entry
export async function PATCH(req: NextRequest) {
  try {
    const isOwner = isOwnerAuthenticated(req);
    const user = await getAuthenticatedUser(req);
    if (!isOwner && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId, action, clientId: bodyClientId } = await req.json();
    // action: "APPROVE" | "REJECT" | "INJECT"
    if (!entryId || !action) {
      return NextResponse.json({ error: 'entryId and action required' }, { status: 400 });
    }

    const clientId = user?.clientId || bodyClientId;
    const reviewedBy = user?.email || 'owner';

    const entry = await prisma.silentListenerEntry.findUnique({ where: { id: entryId } });
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    if (entry.clientId !== clientId && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'APPROVE') {
      await prisma.silentListenerEntry.update({
        where: { id: entryId },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy },
      });
      return NextResponse.json({ success: true, message: 'Entry approved' });
    }

    if (action === 'REJECT') {
      await prisma.silentListenerEntry.update({
        where: { id: entryId },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy },
      });
      return NextResponse.json({ success: true, message: 'Entry rejected' });
    }

    if (action === 'INJECT') {
      // Append the kbEntry to WhatsAppClient.aiKnowledgeBase
      const kbText = entry.kbEntry || `Q: ${entry.customerQuestion}\nA: ${entry.agentAnswer}`;

      // Append to existing KB via raw SQL concat
      await prisma.$executeRaw`
        UPDATE "WhatsAppClient"
        SET "aiKnowledgeBase" = COALESCE("aiKnowledgeBase", '') || E'\n\n---\n' || ${kbText}
        WHERE id = ${entry.clientId}
      `;

      await prisma.silentListenerEntry.update({
        where: { id: entryId },
        data: { status: 'INJECTED', reviewedAt: new Date(), reviewedBy },
      });

      return NextResponse.json({ success: true, message: 'Injected into AI Knowledge Base ✅' });
    }

    // Bulk approve all PENDING
    if (action === 'APPROVE_ALL') {
      const pendingEntries = await prisma.silentListenerEntry.findMany({
        where: { clientId, status: 'PENDING' },
        select: { id: true, kbEntry: true, customerQuestion: true, agentAnswer: true },
      });

      await prisma.silentListenerEntry.updateMany({
        where: { clientId, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy },
      });

      // Inject all approved into KB
      const combined = pendingEntries
        .map((e) => e.kbEntry || `Q: ${e.customerQuestion}\nA: ${e.agentAnswer}`)
        .join('\n\n---\n');

      await prisma.$executeRaw`
        UPDATE "WhatsAppClient"
        SET "aiKnowledgeBase" = COALESCE("aiKnowledgeBase", '') || E'\n\n---\n' || ${combined}
        WHERE id = ${clientId}
      `;

      await prisma.silentListenerEntry.updateMany({
        where: { clientId, status: 'APPROVED' },
        data: { status: 'INJECTED' },
      });

      return NextResponse.json({ success: true, message: `${pendingEntries.length} entries injected` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[SilentListener] Review error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
