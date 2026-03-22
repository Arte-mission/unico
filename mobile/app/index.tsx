import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to login screen initially
  return <Redirect href="/(auth)/login" />;
}
