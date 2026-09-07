import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
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
              orderBy: { createdAt: "desc" },
              take: 10
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, count: customers.length, customers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
