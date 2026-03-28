import { useState, useCallback } from 'react';

export interface Frame {
  rolls: number[];
}

export interface Bowler {
  id: number;
  name: string;
  team: 'a' | 'b' | 'none';
  handicap: number;
  frames: Frame[];
  currentFrame: number;
  consecutiveStrikes: number;
  active: boolean;
  endGameScore: number | null;
}

export type ScoringMode = 'hcpcalc' | 'frame' | 'endgame';

let bowlerIdCounter = 1;

function createBowler(name: string): Bowler {
  return {
    id: bowlerIdCounter++,
    name,
    team: 'none',
    handicap: 0,
    frames: Array.from({ length: 10 }, () => ({ rolls: [] })),
    currentFrame: 0,
    consecutiveStrikes: 0,
    active: false,
    endGameScore: null,
  };
}

export function recalcRunning(frames: Frame[]): (number | null)[] {
  const allRolls: number[] = [];
  frames.forEach(f => allRolls.push(...f.rolls));
  const raw: (number | null)[] = [];
  let rollIdx = 0;

  for (let i = 0; i < 10; i++) {
    const isTenth = i === 9;
    if (!isTenth) {
      if (allRolls[rollIdx] === 10) {
        const b1 = allRolls[rollIdx + 1] ?? null;
        if (b1 === null) { raw.push(null); rollIdx++; continue; }
        raw.push(10 + b1);
        rollIdx++;
      } else {
        if (rollIdx + 1 >= allRolls.length) { raw.push(null); rollIdx++; continue; }
        const sum = allRolls[rollIdx] + allRolls[rollIdx + 1];
        if (sum === 10) {
          const b2 = allRolls[rollIdx + 2] ?? null;
          if (b2 === null) { raw.push(null); rollIdx += 2; continue; }
          raw.push(10 + b2);
        } else {
          raw.push(sum);
        }
        rollIdx += 2;
      }
    } else {
      const tenthFrame = frames[9].rolls;
      let tenthScore = 0;
      tenthFrame.forEach(r => tenthScore += r);
      raw.push(tenthScore);
    }
  }

  const running: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    if (raw[i] === null) { running.push(null); }
    else { sum += raw[i]!; running.push(sum); }
  }
  return running;
}

export function getBowlerTotal(b: Bowler, mode: ScoringMode): number {
  if (mode === 'endgame') {
    return b.endGameScore !== null ? b.endGameScore : 0;
  }
  const scores = recalcRunning(b.frames);
  for (let i = 9; i >= 0; i--) { if (scores[i] !== null) return scores[i]!; }
  return 0;
}

export function getValidRolls(b: Bowler): number[] {
  const cf = b.currentFrame;
  if (cf > 9) return [];
  const rolls = b.frames[cf].rolls;
  const options: number[] = [];

  if (cf < 9) {
    if (rolls.length === 0) {
      for (let i = 0; i <= 10; i++) options.push(i);
    } else {
      for (let i = 0; i <= 10 - rolls[0]; i++) options.push(i);
    }
  } else {
    if (rolls.length === 0) {
      for (let i = 0; i <= 10; i++) options.push(i);
    } else if (rolls.length === 1) {
      if (rolls[0] === 10) { for (let i = 0; i <= 10; i++) options.push(i); }
      else { for (let i = 0; i <= 10 - rolls[0]; i++) options.push(i); }
    } else if (rolls.length === 2) {
      if (rolls[0] === 10 && rolls[1] === 10) {
        for (let i = 0; i <= 10; i++) options.push(i);
      } else if (rolls[0] === 10 && rolls[1] < 10) {
        for (let i = 0; i <= 10 - rolls[1]; i++) options.push(i);
      } else if (rolls[0] + rolls[1] === 10) {
        for (let i = 0; i <= 10; i++) options.push(i);
      }
    }
  }
  return options;
}

function isFrameComplete(b: Bowler, frameIdx: number): boolean {
  const f = b.frames[frameIdx];
  if (frameIdx < 9) {
    return f.rolls.length === 2 || f.rolls[0] === 10;
  } else {
    if (f.rolls.length < 2) return false;
    if (f.rolls[0] === 10 || f.rolls[0] + f.rolls[1] === 10) return f.rolls.length === 3;
    return f.rolls.length === 2;
  }
}

export function useBowlingGame() {
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [scoringMode, setScoringMode] = useState<ScoringMode>('hcpcalc');
  const [gameStarted, setGameStarted] = useState(false);
  const [lockedOrder, setLockedOrder] = useState<number[]>([]);
  const [activeBowlerIdx, setActiveBowlerIdx] = useState(0);

  const addBowler = useCallback((name: string) => {
    setBowlers(prev => [...prev, createBowler(name)]);
  }, []);

  const removeBowler = useCallback((id: number) => {
    setBowlers(prev => prev.filter(b => b.id !== id));
  }, []);

  const recordRoll = useCallback((bowlerId: number, pins: number) => {
    setBowlers(prev => prev.map(b => {
      if (b.id !== bowlerId || b.currentFrame > 9) return b;
      const updated = { ...b, frames: b.frames.map(f => ({ ...f, rolls: [...f.rolls] })) };
      const cf = updated.currentFrame;
      updated.frames[cf].rolls.push(pins);

      if (cf < 9 && pins === 10) updated.consecutiveStrikes++;
      else if (cf < 9) updated.consecutiveStrikes = 0;

      if (isFrameComplete(updated, cf)) {
        if (cf < 9) updated.currentFrame++;
        else updated.currentFrame = 10;
      }
      return updated;
    }));
  }, []);

  const setEndGameScore = useCallback((bowlerId: number, score: number | null) => {
    setBowlers(prev => prev.map(b =>
      b.id === bowlerId ? { ...b, endGameScore: score } : b
    ));
  }, []);

  const setHandicap = useCallback((bowlerId: number, handicap: number) => {
    setBowlers(prev => prev.map(b =>
      b.id === bowlerId ? { ...b, handicap } : b
    ));
  }, []);

  const assignTeam = useCallback((bowlerId: number, team: 'a' | 'b' | 'none') => {
    setBowlers(prev => prev.map(b =>
      b.id === bowlerId ? { ...b, team } : b
    ));
  }, []);

  const renameBowler = useCallback((bowlerId: number, name: string) => {
    setBowlers(prev => prev.map(b =>
      b.id === bowlerId ? { ...b, name } : b
    ));
  }, []);

  const clearFrame = useCallback((bowlerId: number) => {
    setBowlers(prev => prev.map(b => {
      if (b.id !== bowlerId) return b;
      const updated = { ...b, frames: b.frames.map(f => ({ ...f, rolls: [...f.rolls] })) };
      updated.frames[updated.currentFrame] = { rolls: [] };
      return updated;
    }));
  }, []);

  const resetGame = useCallback(() => {
    setBowlers([]);
    setGameStarted(false);
    setLockedOrder([]);
    setActiveBowlerIdx(0);
  }, []);

  return {
    bowlers,
    setBowlers,
    scoringMode,
    setScoringMode,
    gameStarted,
    setGameStarted,
    lockedOrder,
    setLockedOrder,
    activeBowlerIdx,
    setActiveBowlerIdx,
    addBowler,
    removeBowler,
    recordRoll,
    setEndGameScore,
    setHandicap,
    assignTeam,
    renameBowler,
    clearFrame,
    resetGame,
  };
}
