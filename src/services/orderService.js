import { request } from './http';

export function createOrder(data) {
  return request('/orders', {
    method: 'POST',
    data: data, // ✅ Sửa từ body sang data
  });
}
