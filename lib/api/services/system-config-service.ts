
// ============================================
// 4. lib/api/services/system-config.service.ts

import { encryptedApiClient } from "../encrypted-client";
import { API_ENDPOINTS } from "../endpoints";

// ============================================
export interface CreateSystemConfigPayload {
  configKey: string;
  configValue?: string;
  configType?: string;
  isEncrypted?: boolean;
  environment?: string;
}

export class SystemConfigService {
  static async list() {
    return encryptedApiClient.get(API_ENDPOINTS.SYSTEM_CONFIG.LIST);
  }

  static async get(id: string) {
    return encryptedApiClient.get(API_ENDPOINTS.SYSTEM_CONFIG.GET(id));
  }

  static async create(payload: CreateSystemConfigPayload) {
    return encryptedApiClient.post(API_ENDPOINTS.SYSTEM_CONFIG.CREATE, payload);
  }

  static async update(id: string, payload: Partial<CreateSystemConfigPayload>) {
    return encryptedApiClient.put(API_ENDPOINTS.SYSTEM_CONFIG.UPDATE(id), payload);
  }

  static async delete(id: string) {
    return encryptedApiClient.delete(API_ENDPOINTS.SYSTEM_CONFIG.DELETE(id));
  }
}