export interface Commission {
  id: string;
  name: string;
  description?: string;
  organizationId: string; // ID do núcleo ao qual pertence
  isFormationCommission?: boolean; // <-- NOVO CAMPO
}
