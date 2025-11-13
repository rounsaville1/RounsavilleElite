import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const api = {
  getStats: async () => {
    const response = await client.get('/stats');
    return response.data;
  },

  getBlocks: async (limit: number = 20, offset: number = 0) => {
    const response = await client.get('/blocks', { params: { limit, offset } });
    return response.data;
  },

  getBlock: async (id: string | number) => {
    const response = await client.get(`/blocks/${id}`);
    return response.data;
  },

  getTransaction: async (hash: string) => {
    const response = await client.get(`/transactions/${hash}`);
    return response.data;
  },

  getAccount: async (address: string) => {
    const response = await client.get(`/accounts/${address}`);
    return response.data;
  },
};
