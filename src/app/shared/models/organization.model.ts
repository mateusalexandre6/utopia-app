// src/app/core/models/organization.model.ts

export interface Organization {
  id: string;
  name: string;
  level: 'national' | 'state';
  type: 'coordination' | 'nucleus';
  parentid?: string | null;
}
