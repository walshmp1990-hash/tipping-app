import { FixtureStatus, StageType } from '@prisma/client';
import { prisma } from './prisma';
import { parseFixtures } from './csvImport';
import { calculatePerfectRoundBonus, pointsForGoldenGoal, pointsForMoM, pointsForPrediction, shouldIncludeExtras } from './scoring';

export async function importFixtures(csvRaw: string, dryRun = true) {
  const parsed = parseFixtures(csvRaw);
  let createCount = 0;
  let updateCount = 0;

  for (const item of parsed) {
    const existing = await prisma.fixture.findUnique({
      where: {
        competitionId_fixtureNumber: {
          competitionId: item.competitionId,
          fixtureNumber: item.fixtureNumber
        }
      }
    });
    if (existing) updateCount += 1;
    else createCount += 1;
  }

  if (dryRun) return { createCount, updateCount, items: parsed };

  await prisma.$transaction(async (tx) => {
    for (const item of parsed) {
      await tx.competition.upsert({
        where: { id: item.competitionId },
        update: {},
        create: { id: item.competitionId, name: item.competitionId }
      });

      const home = await tx.team.upsert({
        where: { competitionId_name: { competitionId: item.competitionId, name: item.homeTeamName } },
        update: {},
        create: { competitionId: item.competitionId, name: item.homeTeamName }
      });
      const away = await tx.team.upsert({
        where: { competitionId_name: { competitionId: item.competitionId, name: item.awayTeamName } },
        update: {},
        create: { competitionId: item.competitionId, name: item.awayTeamName }
      });

      const round = await tx.round.upsert({
        where: { competitionId_name: { competitionId: item.competitionId, name: item.roundName } },
        update: {
          stageType: item.stageType,
          roundNumber: item.roundNumber,
          sortOrder: item.sortOrder
        },
        create: {
          competitionId: item.competitionId,
          name: item.roundName,
          stageType: item.stageType,
          roundNumber: item.roundNumber,
          sortOrder: item.sortOrder,
          lockAtUtc: item.kickoffAtUtc
        }
      });

      await tx.fixture.upsert({
        where: {
          competitionId_fixtureNumber: {
            competitionId: item.competitionId,
            fixtureNumber: item.fixtureNumber
          }
        },
        update: {
          kickoffAtUtc: item.kickoffAtUtc,
          stageType: item.stageType,
          groupLabel: item.groupLabel,
          roundId: round.id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          stadiumId: item.stadiumId,
          creator: item.creator,
          uniqueImportId: item.uniqueImportId
        },
        create: {
          competitionId: item.competitionId,
          fixtureNumber: item.fixtureNumber,
          kickoffAtUtc: item.kickoffAtUtc,
          stageType: item.stageType,
          groupLabel: item.groupLabel,
          roundId: round.id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          stadiumId: item.stadiumId,
          creator: item.creator,
          uniqueImportId: item.uniqueImportId
        }
      });
    }

    const rounds = await tx.round.findMany({ where: { competitionId: parsed[0]?.competitionId } });
    for (const round of rounds) {
      const minFixture = await tx.fixture.findFirst({ where: { roundId: round.id }, orderBy: { kickoffAtUtc: 'asc' } });
      if (minFixture) {
        await tx.round.update({ where: { id: round.id }, data: { lockAtUtc: minFixture.kickoffAtUtc } });
      }
    }
  });

  return { createCount, updateCount, items: parsed };
}

export async function recalculateFixturePoints(fixtureId: string) {
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: {
      result: true,
      predictions: true,
      extraPredictions: true,
      round: true
    }
  });

  if (!fixture || !fixture.result) return;

  await prisma.pointsAward.deleteMany({ where: { fixtureId } });

  for (const prediction of fixture.predictions) {
    const points = pointsForPrediction(fixture.stageType, prediction.outcome, {
      status: fixture.result.status,
      homeFtGoals: fixture.result.homeFtGoals,
      awayFtGoals: fixture.result.awayFtGoals,
      homeEtGoals: fixture.result.homeEtGoals,
      awayEtGoals: fixture.result.awayEtGoals,
      wentToPens: fixture.result.wentToPens,
      pensWinnerTeamId: fixture.result.pensWinnerTeamId,
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
      officialManOfMatch: fixture.result.officialManOfMatch,
      openingGoalMinuteActual: fixture.result.openingGoalMinuteActual
    });

    if (points > 0) {
      await prisma.pointsAward.create({
        data: {
          userId: prediction.userId,
          fixtureId,
          competitionId: fixture.competitionId,
          category: 'MATCH_OUTCOME',
          points,
          metadata: { outcome: prediction.outcome }
        }
      });
    }

    if (shouldIncludeExtras(fixture.stageType)) {
      const extra = fixture.extraPredictions.find((e) => e.userId === prediction.userId);
      if (extra) {
        const endedNoGoal = fixture.result.homeEtGoals === 0 && fixture.result.awayEtGoals === 0;
        const gg = pointsForGoldenGoal(extra.goldenGoalMinute, extra.noGoal, fixture.result.openingGoalMinuteActual, endedNoGoal);
        if (gg.points > 0) {
          await prisma.pointsAward.create({
            data: {
              userId: prediction.userId,
              fixtureId,
              competitionId: fixture.competitionId,
              category: 'GOLDEN_GOAL',
              points: gg.points,
              metadata: { exact: gg.exact }
            }
          });
        }

        const mom = pointsForMoM(extra.manOfMatch, fixture.result.officialManOfMatch);
        if (mom > 0) {
          await prisma.pointsAward.create({
            data: {
              userId: prediction.userId,
              fixtureId,
              competitionId: fixture.competitionId,
              category: 'MOM',
              points: mom
            }
          });
        }
      }
    }
  }

  await recalculateRoundBonus(fixture.roundId);
}

export async function recalculateRoundBonus(roundId: string) {
  const round = await prisma.round.findUnique({ where: { id: roundId }, include: { fixtures: { include: { predictions: true, result: true } } } });
  if (!round || round.stageType !== StageType.GROUP) return;

  await prisma.pointsAward.deleteMany({ where: { roundId, category: 'PERFECT_ROUND' } });

  const userIds = new Set<string>();
  for (const fixture of round.fixtures) {
    for (const prediction of fixture.predictions) userIds.add(prediction.userId);
  }

  for (const userId of userIds) {
    const points: number[] = [];
    for (const fixture of round.fixtures) {
      const p = fixture.predictions.find((pred) => pred.userId === userId);
      if (!p || !fixture.result) continue;
      points.push(
        pointsForPrediction(round.stageType, p.outcome, {
          status: fixture.result.status,
          homeFtGoals: fixture.result.homeFtGoals,
          awayFtGoals: fixture.result.awayFtGoals,
          homeEtGoals: fixture.result.homeEtGoals,
          awayEtGoals: fixture.result.awayEtGoals,
          wentToPens: fixture.result.wentToPens,
          pensWinnerTeamId: fixture.result.pensWinnerTeamId,
          homeTeamId: fixture.homeTeamId,
          awayTeamId: fixture.awayTeamId
        })
      );
    }

    const bonus = calculatePerfectRoundBonus(points, round.stageType);
    if (bonus > 0 && points.length === round.fixtures.length) {
      await prisma.pointsAward.create({
        data: {
          userId,
          roundId,
          competitionId: round.competitionId,
          category: 'PERFECT_ROUND',
          points: bonus
        }
      });
    }
  }
}

export async function recalculateAllActiveCompetition() {
  const active = await prisma.competition.findFirst({ where: { isActive: true } });
  if (!active) return;
  const fixtures = await prisma.fixture.findMany({ where: { competitionId: active.id }, include: { result: true } });
  for (const fixture of fixtures) {
    if (fixture.result?.status === FixtureStatus.FINISHED) {
      await recalculateFixturePoints(fixture.id);
    }
  }
}
