import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarCollapsed: boolean;
  pageTitle: string;
  breadcrumb: string;
  openMenus: Record<string, boolean>;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  pageTitle: 'Dashboard',
  breadcrumb: 'Overview',
  openMenus: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setPageTitle(state, action: PayloadAction<{ title: string; breadcrumb?: string }>) {
      state.pageTitle = action.payload.title;
      state.breadcrumb = action.payload.breadcrumb || '';
    },
    toggleSidebarMenu(state, action: PayloadAction<string>) {
      const menuId = action.payload;
      state.openMenus[menuId] = !state.openMenus[menuId];
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setPageTitle, toggleSidebarMenu } = uiSlice.actions;
export default uiSlice.reducer;