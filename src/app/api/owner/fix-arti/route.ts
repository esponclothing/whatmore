import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const newEmail = "esponclothing105@gmail.com";
    const oldEmail = "arti@espon.in";

    // 1. Find the new user and employee
    const newUser = await prisma.user.findFirst({
      where: { email: newEmail },
      include: { employee: true }
    });

    // 2. Find the old user and employee
    const oldUser = await prisma.user.findFirst({
      where: { email: oldEmail },
      include: { employee: true }
    });

    if (!newUser || !newUser.employee) {
      return NextResponse.json({ error: "New employee not found for " + newEmail });
    }
    
    const newEmpId = newUser.employee.id;
    let oldEmpId = null;
    let transferred = 0;

    if (oldUser && oldUser.employee) {
      oldEmpId = oldUser.employee.id;
      
      // Transfer chats
      if (oldEmpId !== newEmpId) {
        const updateRes = await prisma.whatsAppConversation.updateMany({
          where: { assignedEmployeeId: oldEmpId },
          data: { assignedEmployeeId: newEmpId }
        });
        transferred = updateRes.count;
      }
    } else {
      // If old user doesn't exist, maybe it was already renamed, but there's a third user?
      // Let's search by name
      const otherUsers = await prisma.user.findMany({
        where: { name: { contains: "arti", mode: 'insensitive' } },
        include: { employee: true }
      });
      
      for (const u of otherUsers) {
        if (u.id !== newUser.id && u.employee) {
          const empId = u.employee.id;
          const updateRes = await prisma.whatsAppConversation.updateMany({
            where: { assignedEmployeeId: empId },
            data: { assignedEmployeeId: newEmpId }
          });
          transferred += updateRes.count;
        }
      }
    }

    return NextResponse.json({ success: true, transferred, newEmpId, oldEmpId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
