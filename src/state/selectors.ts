import type { AppState } from './AppStateStore.js';

export const selectMessages = (state: AppState) => state.messages;
export const selectIsProcessing = (state: AppState) => state.isProcessing;
export const selectModel = (state: AppState) => state.model;
export const selectSettings = (state: AppState) => state.settings;
export const selectTheme = (state: AppState) => state.theme;
export const selectPermissionMode = (state: AppState) => state.permissionMode;
export const selectTotalUsage = (state: AppState) => state.totalUsage;
export const selectVerbose = (state: AppState) => state.verbose;
