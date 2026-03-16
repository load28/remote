// T-13: named exported interface

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  statusMessage: string;
  isOnline: boolean; // N-04: Boolean is 접두사
}

export interface UpdateProfileInput {
  displayName: string;
  statusMessage: string;
  avatarUrl: string;
}
