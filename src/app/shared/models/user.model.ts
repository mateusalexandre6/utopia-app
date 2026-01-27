// src/app/core/models/user.model.ts

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  roles: { [organizationId: string]: string };
}
