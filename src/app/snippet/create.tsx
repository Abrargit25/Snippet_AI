import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CreateSnippetScreen from '../../ui/screens/create_snippet_screen';

export default function CreateSnippetRoute() {
  const params = useLocalSearchParams();
  let initialData;
  try {
    initialData = params.initialData ? JSON.parse(params.initialData as string) : undefined;
  } catch {
    initialData = undefined;
  }
  return <CreateSnippetScreen initialData={initialData} isEdit={params.isEdit === 'true'} />;
}
