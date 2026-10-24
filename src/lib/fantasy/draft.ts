/** Returns the 0-based manager index on the clock for a 0-based pick. */
export function managerAtSnakePick(pickIndex: number, managerCount: number): number {
  if (!Number.isSafeInteger(pickIndex) || pickIndex < 0) {
    throw new RangeError("pickIndex must be a non-negative integer");
  }
  if (!Number.isSafeInteger(managerCount) || managerCount < 2) {
    throw new RangeError("managerCount must be an integer >= 2");
  }
  const round = Math.floor(pickIndex / managerCount);
  const position = pickIndex % managerCount;
  return round % 2 === 0 ? position : managerCount - 1 - position;
}

/**
 * A client preview may show draft order, but a real pick must be serialized,
 * ownership-checked and committed in a database transaction.
 */
export function snakePickOrder(managerCount: number, draftRounds: number): number[] {
  if (!Number.isSafeInteger(draftRounds) || draftRounds < 1) {
    throw new RangeError("draftRounds must be an integer >= 1");
  }
  return Array.from(
    { length: managerCount * draftRounds },
    (_, pick) => managerAtSnakePick(pick, managerCount)
  );
}
