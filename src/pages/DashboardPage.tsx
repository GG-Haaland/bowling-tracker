import { useState, useCallback, useMemo } from 'react';
import type { TeamGame } from '@/lib/types';
import type { SheetState } from '@/hooks/useSheetData';
import MatchupPicker from '@/components/MatchupPicker';
import RosterCard from '@/components/RosterCard';
import HcpCalcCard from '@/components/HcpCalcCard';
import HandicapEdgeCard from '@/components/HandicapEdgeCard';
import WeekScorecard from '@/components/WeekScorecard';
import TopBowls from '@/components/TopBowls';
import DataStatusCard from '@/components/DataStatusCard';
import WeekSelector from '@/components/WeekSelector';
import EndGameCard from '@/components/EndGameCard';

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
  onChangeTeamByName: (teamName: string) => void;
  onNavigateHandicap: () => void;
  onNavigateLeaderboard: () => void;
  onNavigateSchedule: () => void;
  onNavigateStandings: () => void;
}

export default function DashboardPage({
  sheetData,
  selectedTeamName,
  currentWeekIndex,
  selectedDate,
  onChangeWeek,
  onChangeTeamByName,
  onNavigateHandicap,
  onNavigateLeaderboard,
  onNavigateSchedule,
  onNavigateStandings,
}: DashboardPageProps) {
  const weekNum = currentWeekIndex + 1;
  const schedule = sheetData.allWeeks[currentWeekIndex] || { week: '', date: '', slots: [] };
  const teamData = sheetData.teamDataCache[selectedTeamName] || null;

  // Determine if this week is in the past or future
  const isPastWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return sel < today; // today and future → future layout
  }, [selectedDate]);

  // Player selection state (only used in future layout)
  const [selectedPlayersA, setSelectedPlayersA] = useState<string[]>([]);
  const [selectedPlayersB, setSelectedPlayersB] = useState<string[]>([]);
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
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

  // When team changes in Matchup Picker, propagate up to App
  const handleTeamChange = useCallback((teamName: string) => {
    onChangeTeamByName(teamName);
    // Reset matchup state since team changed
    setTeamAName('');
    setTeamBName('');
    setSelectedPlayersA([]);
    setSelectedPlayersB([]);
    setMatchupSelected(false);
  }, [onChangeTeamByName]);

  /* ─────────────────────────────────────────────
     TOP NAV BAR
     ───────────────────────────────────────────── */
  const navBar = (
    <div style={{
      display: 'flex',
      gap: '0.5em',
      marginBottom: '0.3em',
    }}>
      <button
        className="contact-btn"
        onClick={onNavigateLeaderboard}
        style={{
          flex: 1,
          padding: '0.55em 0.8em',
          fontSize: '0.82em',
          letterSpacing: '0.1em',
        }}
      >
        LEADERBOARD
      </button>
      <button
        className="contact-btn"
        onClick={onNavigateSchedule}
        style={{
          flex: 1,
          padding: '0.55em 0.8em',
          fontSize: '0.82em',
          letterSpacing: '0.1em',
        }}
      >
        SCHEDULE
      </button>
      <button
        className="contact-btn"
        onClick={onNavigateStandings}
        style={{
          flex: 1,
          padding: '0.55em 0.8em',
          fontSize: '0.82em',
          letterSpacing: '0.1em',
        }}
      >
        STANDINGS
      </button>
    </div>
  );

  /* ─────────────────────────────────────────────
     SHARED: Your Team profile card
     ───────────────────────────────────────────── */
  const yourTeamCard = (
    <div className="profile-card">
      <div style={{
        background: 'var(--black)',
        borderRadius: '0.7em',
        padding: '1em',
        marginBottom: '0.7em',
      }}>
        <div style={{
          fontSize: '0.72em',
          letterSpacing: '0.16em',
          color: 'var(--light-blue)',
          marginBottom: '0.2em',
        }}>
          YOUR TEAM
        </div>
        <div style={{
          fontSize: '1.2em',
          fontWeight: 900,
          color: 'white',
          letterSpacing: '0.06em',
        }}>
          {selectedTeamName.toUpperCase()}
        </div>
      </div>
      <button
        className="contact-btn"
        onClick={onNavigateHandicap}
        style={{ marginBottom: 0, padding: '0.6em', fontSize: '0.88em' }}
      >
        HANDICAP SHEET
      </button>
    </div>
  );

  /* ─────────────────────────────────────────────
     SHARED: Week Selector
     ───────────────────────────────────────────── */
  const weekSelector = (
    <WeekSelector
      currentWeek={weekNum}
      selectedDate={selectedDate}
      onChangeWeek={onChangeWeek}
    />
  );

  /* ─────────────────────────────────────────────
     SHARED: Matchup Picker (now with onTeamChange)
     ───────────────────────────────────────────── */
  const matchupPicker = (
    <MatchupPicker
      schedule={schedule}
      selectedTeamName={selectedTeamName}
      getTeamGames={sheetData.getTeamGames}
      roster={sheetData.roster}
      onSelectGame={handleSelectGame}
      onTeamChange={handleTeamChange}
    />
  );

  const dataStatus = <DataStatusCard roster={sheetData.roster} />;

  /* ═════════════════════════════════════════════
     FUTURE WEEK LAYOUT
     NAV BAR → YOUR TEAM → WEEK SELECTOR → HANDICAP EDGE →
     MATCHUP PICKER → PLAYER CARDS → HCP CALCULATOR → DATA STATUS
     ═════════════════════════════════════════════ */
  if (!isPastWeek) {
    return (
      <div className="dashboard dot-bg" style={{ opacity: 1 }}>
        <div className="dashboard-stack">
          {/* 0. NAV BAR */}
          {navBar}

          {/* 1. YOUR TEAM */}
          {yourTeamCard}

          {/* 2. WEEK SELECTOR (under handicap button) */}
          {weekSelector}

          {/* 3. HANDICAP EDGE */}
          <HandicapEdgeCard
            selectedPlayersA={selectedPlayersA}
            selectedPlayersB={selectedPlayersB}
            teamAName={teamAName}
            teamBName={teamBName}
            roster={sheetData.roster}
          />

          {/* 4. MATCHUP PICKER */}
          {matchupPicker}

          {/* 5. PLAYER CARDS (only after matchup selected) */}
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
            <div className="card" style={{
              textAlign: 'center',
              padding: '1.5em',
              color: 'var(--soft-black)',
              fontSize: '0.82em',
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
            }}>
              Select a matchup above to pick players
            </div>
          )}

          {/* 6. HCP CALCULATOR */}
          <HcpCalcCard
            selectedPlayersA={selectedPlayersA}
            selectedPlayersB={selectedPlayersB}
            teamAName={teamAName}
            teamBName={teamBName}
            roster={sheetData.roster}
          />
          {/* 7. END GAME */}
          <EndGameCard
            selectedPlayersA={selectedPlayersA}
            selectedPlayersB={selectedPlayersB}
            teamAName={teamAName}
            teamBName={teamBName}
            roster={sheetData.roster}
          />

          {/* 8. DATA STATUS */}
          {dataStatus}
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════
     PAST WEEK LAYOUT
     NAV BAR → YOUR TEAM → WEEK SELECTOR → TOP TEN BOWLERS →
     MATCHUP PICKER → WEEK RESULTS → DATA STATUS
     ═════════════════════════════════════════════ */
  return (
    <div className="dashboard dot-bg" style={{ opacity: 1 }}>
      <div className="dashboard-stack">
        {/* 0. NAV BAR */}
        {navBar}

        {/* 1. YOUR TEAM */}
        {yourTeamCard}

        {/* 2. WEEK SELECTOR (under handicap button) */}
        {weekSelector}

        {/* 3. TOP TEN BOWLERS */}
        <TopBowls
          weekNum={weekNum}
          weekDateMap={sheetData.weekDateMap}
          loadTeamData={sheetData.loadTeamData}
        />

        {/* 4. MATCHUP PICKER */}
        {matchupPicker}

        {/* 5. WEEK RESULTS */}
        <WeekScorecard
          teamData={teamData}
          weekNum={weekNum}
          teamAvgMap={sheetData.teamAvgMap}
          loadTeamData={sheetData.loadTeamData}
          lookupTeamAvg={sheetData.lookupTeamAvg}
        />

        {/* 6. DATA STATUS */}
        {dataStatus}
      </div>
    </div>
  );
}
