import api from './axiosInstance';
import { Certificate } from '@/types';

export const certificateApi = {
  getMyCertificates: () =>
    api.get<{ success: boolean; data: Certificate[] }>('/api/v1/certificates/me/list'),
  
  generateCertificate: (courseId: string) =>
    api.post<{ success: boolean; data: Certificate; message: string }>(
      `/api/v1/certificates/generate/${courseId}`
    ),
  
  verifyCertificate: (certificateId: string) =>
    api.get<{ success: boolean; data: Certificate }>(`/api/v1/certificates/${certificateId}`),
};
