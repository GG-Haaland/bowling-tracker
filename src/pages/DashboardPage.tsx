import { useState, useCallback } from 'react';
import type { TeamGame } from '@/lib/types';
import { TEAM_NAMES } from '@/lib/constants';
import type { SheetState } from '@/hooks/useSheetData';

import BottomBar from '@/components/BottomBar';
import MatchupPicker from '@/components/MatchupPicker';
import RosterCard from '@/components/RosterCard';
import HcpCalcCard from '@/components/HcpCalcCard';
import HandicapEdgeCard from '@/components/HandicapEdgeCard';
import WeekScorecard from '@/components/WeekScorecard';
import TopBowls from '@/components/TopBowls';
import DataStatusCard from '@/components/DataStatusCard';
import { useBowlingGame } from '@/hooks/useBowlingGame';

interface DashboardPageProps {
  sheetData: SheetState & {
    loadTeamData: (name: string) => Promise<any>;
    lookupTeamAvg: (name: string) => number;
    getTeamGames: (teamName: string, schedule: any) => TeamGame[];
    teamDataCache: Record<string, any>;
  };
  selectedTeamName: string;
  currentWeekIndex: number;
  selectedDate: Date;
  onChangeWeek: (delta: number) => void;
  onNavigateHandicap: () => void;
}

export default function DashboardPage({
  sheetData,
  selectedTeamName,
  currentWeekIndex,
  selectedDate,
  onChangeWeek,
  onNavigateHandicap,
}: DashboardPageProps) {
  const weekNum = currentWeekIndex + 1;
  const schedule = sheetData.allWeeks[currentWeekIndex] || { week: '', date: '', slots: [] };
  const teamData = sheetData.teamDataCache[selectedTeamName] || null;
  const game = useBowlingGame();

  // Player selection state
  const [selectedPlayersA, setSelectedPlayersA] = useState<string[]>([]);
  const [selectedPlayersB, setSelectedPlayersB] = useState<string[]>([]);
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');

  // Track whether a matchup game has been selected
  const [matchupSelected, setMatchupSelected] = useState(false);

  const togglePlayerA = useCallback((name: string) => {
    setSelectedPlayersA(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
  }, []);

  const togglePlayerB = useCallback((name: string) => {
    setSelectedPlayersB(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
  }, []);

  const handleSelectGame = useCallback((g: TeamGame, _idx: number) => {
    setTeamAName(selectedTeamName);
    setTeamBName(g.opponent);
    setSelectedPlayersA([]);
    setSelectedPlayersB([]);
    setMatchupSelected(true);
  }, [selectedTeamName]);

  return (
    <div className="dashboard dot-bg" style={{ opacity: 1 }}>
      <div className="main-grid">
        {/* ─── LEFT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.11em' }}>
          {/* Profile / Team badge */}
          <div className="profile-card">
            <div style={{
              background: 'var(--black)',
              borderRadius: '0.7em',
              padding: '1em',
              marginBottom: '0.7em',
            }}>
              <div style={{ fontSize: '0.72em', letterSpacing: '0.16em', color: 'var(--light-blue)', marginBottom: '0.2em' }}>
                YOUR TEAM
              </div>
              <div style={{ fontSize: '1.2em', fontWeight: 900, color: 'white', letterSpacing: '0.06em' }}>
                {selectedTeamName.toUpperCase()}
              </div>
            </div>
            <button className="contact-btn" onClick={onNavigateHandicap} style={{ marginBottom: 0, padding: '0.6em', fontSize: '0.88em' }}>
              HANDICAP SHEET
            </button>
          </div>

          {/* HANDICAP EDGE card — always visible */}
          <HandicapEdgeCard
            selectedPlayersA={selectedPlayersA}
            selectedPlayersB={selectedPlayersB}
            teamAName={teamAName}
            teamBName={teamBName}
            roster={sheetData.roster}
          />

          {/* Matchup Picker */}
          <MatchupPicker
            schedule={schedule}
            selectedTeamName={selectedTeamName}
            getTeamGames={sheetData.getTeamGames}
            roster={sheetData.roster}
            onSelectGame={handleSelectGame}
          />

          {/* Team rosters — only shown after a matchup game is selected */}
          {matchupSelected ? (
            <>
              <RosterCard
                side="a"
                teamName={teamAName}
                roster={sheetData.roster}
                selectedPlayers={selectedPlayersA}
                onTogglePlayer={togglePlayerA}
              />
              <RosterCard
                side="b"
                teamName={teamBName}
                roster={sheetData.roster}
                selectedPlayers={selectedPlayersB}
                onTogglePlayer={togglePlayerB}
              />
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '1.5em', color: 'var(--soft-black)', fontSize: '0.82em', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
              Select a matchup above to pick players
            </div>
          )}

          <DataStatusCard roster={sheetData.roster} />
        </div>

        {/* ─── CENTER / RIGHT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.11em' }}>
          {/* HCP Calculator (visible in hcpcalc mode) */}
          {game.scoringMode === 'hcpcalc' && (
            <HcpCalcCard
              selectedPlayersA={selectedPlayersA}
              selectedPlayersB={selectedPlayersB}
              teamAName={teamAName}
              teamBName={teamBName}
              roster={sheetData.roster}
            />
          )}

          {/* Week Scorecard */}
          <WeekScorecard
            teamData={teamData}
            weekNum={weekNum}
            teamAvgMap={sheetData.teamAvgMap}
            loadTeamData={sheetData.loadTeamData}
            lookupTeamAvg={sheetData.lookupTeamAvg}
          />

          {/* Top Bowls */}
          <TopBowls
            weekNum={weekNum}
            weekDateMap={sheetData.weekDateMap}
            loadTeamData={sheetData.loadTeamData}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <BottomBar
        currentWeek={weekNum}
        selectedDate={selectedDate}
        scoringMode={game.scoringMode}
        onChangeWeek={onChangeWeek}
        onSetMode={game.setScoringMode}
        onSaveWeek={() => {/* TODO */}}
        onLockOrder={() => {/* TODO */}}
        onReset={game.resetGame}
      />
    </div>
  );
}
