// T-13: named exported interface

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean; // N-04: Boolean is 접두사
}
