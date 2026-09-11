import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './store';

// Typed versions of the Redux hooks. Use these instead of the plain ones.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
