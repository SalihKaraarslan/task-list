import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { store } from './src/app/store';
import { TaskListScreen } from './src/features/tasks/TaskListScreen';

export default function App() {
  return (
    // Provider gives every component access to the Redux store.
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <TaskListScreen />
      </SafeAreaProvider>
    </Provider>
  );
}
