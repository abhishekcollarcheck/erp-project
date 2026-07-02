import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User, ManagedCompany } from "../../types/auth.types";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  permissions: [],
  activeCompanyId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
setCredentials(state, action) {
  console.log("SET CREDENTIALS");
  console.log("USER COMPANY", action.payload.user.companyId);
  console.log("OLD ACTIVE", state.activeCompanyId);

  const { user, accessToken } = action.payload;

  state.user = user;
  state.accessToken = accessToken;
  state.isAuthenticated = true;

  if (!state.activeCompanyId) {
    state.activeCompanyId = user.companyId;
  }

  console.log("NEW ACTIVE", state.activeCompanyId);
},

    switchCompany(state, action: PayloadAction<number>) {
      const company = state.user?.managedCompanies.find(
        c => c.id === action.payload
      );
      if (!company || !state.user) return;
      state.activeCompanyId = company.id;
      state.permissions = company.permissions ?? [];

      state.user.companyId = company.id;
      state.user.roleId = company.role_id;
      state.user.roleSlug = company.role_slug;
      state.user.permissions = company.permissions ?? [];
    },

    updateToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },

    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.activeCompanyId = null;
    },

    setPermissions(state, action: PayloadAction<string[]>) {
      console.log("🔥 SET PERMISSIONS REDUCER", action.payload);
      state.permissions = action.payload;

      if (!state.user) return;

      state.user.permissions = action.payload;

      const company = state.user.managedCompanies.find(
        c => c.id === state.activeCompanyId
      );

      if (company) {
        company.permissions = action.payload;
      }
      console.log("AFTER", state);
    },

    // Refresh managed companies list after assigning/removing
    setManagedCompanies(state, action: PayloadAction<ManagedCompany[]>) {
      if (!state.user) return;

      state.user.managedCompanies = action.payload;

      const company = action.payload.find(
        c => c.id === state.activeCompanyId
      );

      if (company) {
        state.permissions = company.permissions ?? [];
      }
    },
    updateCurrentUser(state, action: PayloadAction<User>) {
      state.user = action.payload;

      const company = action.payload.managedCompanies.find(
        c => c.id === state.activeCompanyId
      );

      if (company) {
        state.permissions = company.permissions ?? [];

        state.user.roleId = company.role_id;
        state.user.roleSlug = company.role_slug;
        state.user.companyId = company.id;
        state.user.permissions = company.permissions ?? [];
      } else {
        state.permissions = action.payload.permissions ?? [];
      }
    }
  },
});

export const {
  setCredentials,
  switchCompany,
  updateToken,
  clearCredentials,
  setPermissions,
  setManagedCompanies,
  updateCurrentUser
} = authSlice.actions;

export default authSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectUser = (s: { auth: AuthState }) => s.auth.user;
export const selectIsAuthenticated = (s: { auth: AuthState }) =>
  s.auth.isAuthenticated;
export const selectPermissions = (s: { auth: AuthState }) =>
  s.auth.permissions;
export const selectCurrentRole = (s: { auth: AuthState }) =>
  s.auth.user?.roleSlug;
export const selectIsSuperAdmin = (s: { auth: AuthState }) =>
  s.auth.user?.isSuperAdmin ?? false;
export const selectEmployeeId = (s: { auth: AuthState }) =>
  s.auth.user?.employeeId ?? null;
export const selectActiveCompanyId = (s: { auth: AuthState }) =>
  s.auth.activeCompanyId;
export const selectManagedCompanies = (s: { auth: AuthState }) =>
  s.auth.user?.managedCompanies ?? [];
export const selectActiveCompany = (s: { auth: AuthState }) => {
  const id = s.auth.activeCompanyId;
  const managed = s.auth.user?.managedCompanies ?? [];
  return managed.find((c) => c.id === id) ?? null;
};
