import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { normalizeArrayResponse, normalizeObjectResponse } from './responseNormalizer';
import { Cliente, CreateClienteDto, UpdateClienteDto } from '../types/cliente';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ClientesService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      const token = authService.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getAll(): Promise<Cliente[]> {
    try {
      const response = await this.api.get<unknown>('/clientes');
      return normalizeArrayResponse<Cliente>(response.data, 'clientes');
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getById(id: number): Promise<Cliente> {
    try {
      const response = await this.api.get<unknown>(`/clientes/${id}`);
      return normalizeObjectResponse<Cliente>(response.data, 'cliente');
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async create(data: CreateClienteDto): Promise<Cliente> {
    try {
      const response = await this.api.post<Cliente>('/clientes', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async update(id: number, data: UpdateClienteDto): Promise<Cliente> {
    try {
      const response = await this.api.patch<Cliente>(`/clientes/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async delete(id: number): Promise<{ message: string }> {
    try {
      const response = await this.api.delete<{ message: string }>(`/clientes/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }
}

export default new ClientesService();
