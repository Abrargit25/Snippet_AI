import { useLocalSearchParams } from 'expo-router';
import AiInsightScreen from '../../ui/screens/ai_insight_screen';

export default function AiInsightRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AiInsightScreen id={id ?? ''} />;
}
