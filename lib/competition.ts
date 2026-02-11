import { prisma } from './prisma';

export async function getActiveCompetition() {
  return prisma.competition.findFirst({ where: { isActive: true } });
}

export async function activateCompetition(competitionId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.competition.updateMany({ where: { isActive: true }, data: { isActive: false } });
    return tx.competition.update({ where: { id: competitionId }, data: { isActive: true } });
  });
}
