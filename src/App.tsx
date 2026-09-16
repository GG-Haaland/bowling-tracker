import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_SEASON, SEASONS, getMostRecentWednesday } from '@/lib/constants';
import type { SeasonConfig } from '@/lib/constants';
import { useSheetData } from '@/hooks/useSheetData';
import IntroScreen from '@/components/IntroScreen';
import HandicapPage from '@/components/HandicapPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import SchedulePage from '@/pages/SchedulePage';
import StandingsPage from '@/pages/StandingsPage';
import DashboardPage from '@/pages/DashboardPage';
import ArchiveDashboard from '@/pages/ArchiveDashboard';
import PlayoffPage from '@/pages/PlayoffPage';

type View = 'intro' | 'dashboard' | 'handicap' | 'leaderboard' | 'schedule' | 'standings' | 'playoff' | 'teams';

export default function App() {
  const [view, setView] = useState<View>('intro');
  const [season, setSeason] = useState<SeasonConfig>(DEFAULT_SEASON);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);
  const selectedTeamName = season.teamNames[selectedTeamIndex];

  // Week & date state
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getMostRecentWednesday);

  // Load all sheet data for the active season
  const sheetData = useSheetData(selectedTeamName, season);

  // Reset team index when switching seasons
  const handleChangeSeason = useCallback((newSeason: SeasonConfig) => {
    setSeason(newSeason);
    setSelectedTeamIndex(0); // Reset to Gutter & Sons (always first)
    setCurrentWeekIndex(0);
    setView('intro');
  }, []);

  // After data loads, find the current week
  useEffect(() => {
    if (sheetData.loading) return;

    const today = getMostRecentWednesday();
    let matchIdx = -1;

    // Try weekDateMap
    for (let w = 1; w <= season.totalWeeks; w++) {
      const d = sheetData.weekDateMap[w];
      if (d && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
        matchIdx = w - 1;
        break;
      }
    }
    // Fall back to most recent past week
    if (matchIdx === -1) {
      const now = new Date();
      for (let w = season.totalWeeks; w >= 1; w--) {
        const d = sheetData.weekDateMap[w];
        if (d && d <= now) { matchIdx = w - 1; break; }
      }
    }
    if (matchIdx === -1) matchIdx = 0;

    setCurrentWeekIndex(matchIdx);
    setSelectedDate(sheetData.weekDateMap[matchIdx + 1] || today);
  }, [sheetData.loading, sheetData.weekDateMap, season.totalWeeks]);

  const handleChangeTeam = useCallback((delta: number) => {
    setSelectedTeamIndex(prev =>
      (prev + delta + season.teamNames.length) % season.teamNames.length
    );
  }, [season.teamNames.length]);

  const handleChangeTeamByName = useCallback((teamName: string) => {
    const idx = season.teamNames.findIndex(
      t => t.toLowerCase() === teamName.toLowerCase()
    );
    if (idx !== -1) {
      setSelectedTeamIndex(idx);
    }
  }, [season.teamNames]);

  const handleChangeWeek = useCallback((delta: number) => {
    setCurrentWeekIndex(prev => {
      const maxIdx = Math.max(season.totalWeeks - 1, sheetData.allWeeks.length - 1);
      const newIdx = Math.max(0, Math.min(maxIdx, prev + delta));
      const weekDate = sheetData.weekDateMap[newIdx + 1];
      if (weekDate) setSelectedDate(weekDate);
      return newIdx;
    });
  }, [sheetData.allWeeks.length, sheetData.weekDateMap, season.totalWeeks]);

  const handleEnterDashboard = useCallback(() => {
    setView('dashboard');
  }, []);

  const handleNavigateHandicap = useCallback(() => {
    setView('handicap');
  }, []);

  const handleBackFromHandicap = useCallback(() => {
    setView(season.isArchive ? 'dashboard' : 'dashboard');
  }, [season.isArchive]);

  const handleNavigateTeams = useCallback(() => {
    setView('teams');
  }, []);

  const handleBackFromTeams = useCallback(() => {
    setView('dashboard');
  }, []);

  const handleNavigateLeaderboard = useCallback(() => {
    setView('leaderboard');
  }, []);

  const handleBackFromLeaderboard = useCallback(() => {
    setView('dashboard');
  }, [season.isArchive]);

  const handleNavigateSchedule = useCallback(() => {
    setView('schedule');
  }, []);

  const handleBackFromSchedule = useCallback(() => {
    setView('dashboard');
  }, []);

  const handleNavigateStandings = useCallback(() => {
    setView('standings');
  }, []);

  const handleBackFromStandings = useCallback(() => {
    setView('dashboard');
  }, []);

  const handleNavigatePlayoff = useCallback(() => {
    setView('playoff');
  }, []);

  const handleBackFromPlayoff = useCallback(() => {
    setView('intro');
  }, []);

  if (view === 'intro') {
    return (
      <IntroScreen
        selectedTeamIndex={selectedTeamIndex}
        selectedDate={selectedDate}
        currentWeek={currentWeekIndex + 1}
        loading={sheetData.loading}
        onChangeTeam={handleChangeTeam}
        onChangeWeek={handleChangeWeek}
        onEnter={handleEnterDashboard}
        onPlayoffs={handleNavigatePlayoff}
        season={season}
        seasons={SEASONS}
        onChangeSeason={handleChangeSeason}
      />
    );
  }

  if (view === 'playoff') {
    return (
      <PlayoffPage onBack={handleBackFromPlayoff} />
    );
  }

  if (view === 'handicap' || view === 'teams') {
    return (
      <HandicapPage
        roster={sheetData.roster}
        selectedTeamName={selectedTeamName}
        loadTeamData={sheetData.loadTeamData}
        onBack={view === 'teams' ? handleBackFromTeams : handleBackFromHandicap}
        teamNames={season.teamNames}
      />
    );
  }

  if (view === 'leaderboard') {
    return (
      <LeaderboardPage
        onBack={handleBackFromLeaderboard}
        season={season}
      />
    );
  }

  if (view === 'schedule') {
    return (
      <SchedulePage
        onBack={handleBackFromSchedule}
        selectedTeamName={selectedTeamName}
        initialWeekIndex={currentWeekIndex}
        season={season}
      />
    );
  }

  if (view === 'standings') {
    return (
      <StandingsPage
        onBack={handleBackFromStandings}
        selectedTeamName={selectedTeamName}
        season={season}
      />
    );
  }

  // Archive seasons get a simplified dashboard
  if (season.isArchive) {
    return (
      <ArchiveDashboard
        season={season}
        onNavigateLeaderboard={handleNavigateLeaderboard}
        onNavigateStandings={handleNavigateStandings}
        onNavigateTeams={handleNavigateTeams}
        onBack={() => setView('intro')}
      />
    );
  }

  return (
    <DashboardPage
      sheetData={sheetData}
      selectedTeamName={selectedTeamName}
      currentWeekIndex={currentWeekIndex}
      selectedDate={selectedDate}
      onChangeWeek={handleChangeWeek}
      onChangeTeamByName={handleChangeTeamByName}
      onNavigateHandicap={handleNavigateHandicap}
      onNavigateLeaderboard={handleNavigateLeaderboard}
      onNavigateSchedule={handleNavigateSchedule}
      onNavigateStandings={handleNavigateStandings}
      season={season}
    />
  );
}
