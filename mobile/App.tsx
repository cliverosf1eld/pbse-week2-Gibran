// KANTIN mobile starter · Meetings 8–10.
// Each step of the Meeting 8 live build is its own file in src/steps/.
// To switch step, change the one import line below and save.
import { StatusBar } from 'expo-status-bar';
import Step from './src/screens/CourtListScreen';

export default function App() {
  return (
    <>
      <Step />
      <StatusBar style="auto" />
    </>
  );
}