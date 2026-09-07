import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.whatsAppAgentUser.findMany();
    const users = await prisma.user.findMany();
    const employees = await prisma.employee.findMany();
    const convs = await prisma.whatsAppConversation.findMany({ select: { id: true, assignedEmployeeId: true } });
    const george = await prisma.customer.findMany({
      where: {
        OR: [
          { contactPerson: { contains: "George", mode: "insensitive" } },
          { businessName: { contains: "George", mode: "insensitive" } },
          { mobile: { contains: "18810104" } },
          { whatsappNumber: { contains: "18810104" } }
        ]
      },
      include: {
        whatsAppConversations: {
          include: {
            messages: {
              orderBy: { sentAt: "desc" },
              take: 10
            }
          }
        }
      }
    });

    return NextResponse.json({ agents, users, employees, convs, george });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
