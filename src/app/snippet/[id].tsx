import { useLocalSearchParams } from 'expo-router';
import SnippetDetailsScreen from '../../ui/screens/snippet_details_screen';

export default function SnippetDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SnippetDetailsScreen id={id ?? ''} />;
}
