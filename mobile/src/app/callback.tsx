import { Redirect } from 'expo-router';

// The browser returns here after sign-in. The sign-in code has already read the
// result, so this route only keeps the deep link from showing a "not found" page.
export default function CallbackRoute() {
  return <Redirect href="/" />;
}
