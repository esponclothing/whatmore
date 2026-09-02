import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const newEmail = "esponclothing105@gmail.com";
    const oldEmail = "arti@espon.in";

    // 1. Find the new user and employee
    const newUser = await prisma.user.findFirst({
      where: { email: newEmail },
      include: { Employee: true }
    });

    // 2. Find the old user and employee
    const oldUser = await prisma.user.findFirst({
      where: { email: oldEmail },
      include: { Employee: true }
    });

    if (!newUser || !newUser.Employee || newUser.Employee.length === 0) {
      return NextResponse.json({ error: "New employee not found for " + newEmail });
    }
    
    const newEmpId = newUser.Employee[0].id;
    let oldEmpId = null;
    let transferred = 0;

    if (oldUser && oldUser.Employee && oldUser.Employee.length > 0) {
      oldEmpId = oldUser.Employee[0].id;
      
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
        include: { Employee: true }
      });
      
      for (const u of otherUsers) {
        if (u.id !== newUser.id && u.Employee.length > 0) {
          const empId = u.Employee[0].id;
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
