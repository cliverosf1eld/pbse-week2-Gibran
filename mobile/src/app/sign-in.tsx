import { useApp } from '../AppContext';
import SignInScreen from '../screens/SignInScreen';

export default function SignInRoute() {
  const { auth } = useApp();
  return <SignInScreen auth={auth} />;
}
