import { useState, useCallback, useEffect } from 'react';
import { TEAM_NAMES, getMostRecentWednesday, TOTAL_WEEKS } from '@/lib/constants';
import { useSheetData } from '@/hooks/useSheetData';
import IntroScreen from '@/components/IntroScreen';
import HandicapPage from '@/components/HandicapPage';
import DashboardPage from '@/pages/DashboardPage';

type View = 'intro' | 'dashboard' | 'handicap';

export default function App() {
  const [view, setView] = useState<View>('intro');
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0);
  const selectedTeamName = TEAM_NAMES[selectedTeamIndex];

  // Week & date state
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getMostRecentWednesday);

  // Load all sheet data
  const sheetData = useSheetData(selectedTeamName);

  // After data loads, find the current week
  useEffect(() => {
    if (sheetData.loading) return;

    const today = getMostRecentWednesday();
    let matchIdx = -1;

    // Try weekDateMap
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const d = sheetData.weekDateMap[w];
      if (d && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
        matchIdx = w - 1;
        break;
      }
    }

    // Fall back to most recent past week
    if (matchIdx === -1) {
      const now = new Date();
      for (let w = TOTAL_WEEKS; w >= 1; w--) {
        const d = sheetData.weekDateMap[w];
        if (d && d <= now) { matchIdx = w - 1; break; }
      }
    }
    if (matchIdx === -1) matchIdx = 0;

    setCurrentWeekIndex(matchIdx);
    setSelectedDate(sheetData.weekDateMap[matchIdx + 1] || today);
  }, [sheetData.loading, sheetData.weekDateMap]);

  const handleChangeTeam = useCallback((delta: number) => {
    setSelectedTeamIndex(prev =>
      (prev + delta + TEAM_NAMES.length) % TEAM_NAMES.length
    );
  }, []);

  const handleChangeWeek = useCallback((delta: number) => {
    setCurrentWeekIndex(prev => {
      const maxIdx = Math.max(11, sheetData.allWeeks.length - 1);
      const newIdx = Math.max(0, Math.min(maxIdx, prev + delta));
      const weekDate = sheetData.weekDateMap[newIdx + 1];
      if (weekDate) setSelectedDate(weekDate);
      return newIdx;
    });
  }, [sheetData.allWeeks.length, sheetData.weekDateMap]);

  const handleEnterDashboard = useCallback(() => {
    setView('dashboard');
  }, []);

  const handleNavigateHandicap = useCallback(() => {
    setView('handicap');
  }, []);

  const handleBackFromHandicap = useCallback(() => {
    setView('dashboard');
  }, []);

  if (view === 'intro') {
    return (
      <IntroScreen
        selectedTeamIndex={selectedTeamIndex}
        selectedDate={selectedDate}
        currentWeek={currentWeekIndex + 1}
        loading={sheetData.loading}
        onChangeTeam={handleChangeTeam}
        onEnter={handleEnterDashboard}
      />
    );
  }

  if (view === 'handicap') {
    return (
      <HandicapPage
        roster={sheetData.roster}
        selectedTeamName={selectedTeamName}
        loadTeamData={sheetData.loadTeamData}
        onBack={handleBackFromHandicap}
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
      onNavigateHandicap={handleNavigateHandicap}
    />
  );
}
