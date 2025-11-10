// src/services/http.js
import { getAuthToken } from "../stores/auth";

/* ==========================
   Cấu hình mặc định
========================== */
const DEFAULT_HEADERS = {
  "ngrok-skip-browser-warning": "true", // bỏ cảnh báo DevTunnel
};

const rawBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://tx972csv-5000.asse.devtunnels.ms/api"
).trim();

const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");

/* ==========================
   Hàm build URL + query
========================== */
function buildUrl(path = "", params) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!params || Object.keys(params).length === 0) return `${API_BASE_URL}${cleanPath}`;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });

  return `${API_BASE_URL}${cleanPath}?${search.toString()}`;
}

/* ==========================
   Hàm request chuẩn hóa
========================== */
export async function request(
  path,
  { method = "GET", params, data, headers = {}, auth = true } = {}
) {
  const url = buildUrl(path, params);
  const token = auth ? getAuthToken() : null;

  const init = {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
  };

  // Nếu có token thì thêm Authorization
  if (token) {
    init.headers.Authorization = `Bearer ${token}`;
  }

  // Nếu có dữ liệu gửi đi (POST/PUT)
  if (data !== undefined) {
    const isFormData =
      typeof FormData !== "undefined" && data instanceof FormData;

    if (isFormData) {
      // Để trình duyệt tự set Content-Type khi gửi FormData
      delete init.headers["Content-Type"];
      init.body = data;
    } else {
      // Gửi JSON chuẩn
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(data);
    }
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    // Nếu không kết nối được tới server
    throw new Error("Không thể kết nối tới server. Có thể DevTunnel hoặc backend đã tắt.");
  }

  const text = await response.text();

  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Không đọc được phản hồi từ server (${response.status})`);
  }

  // Xử lý lỗi HTTP (status >= 400)
  if (!response.ok || json?.success === false) {
    const message = json?.message || `Yêu cầu thất bại (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.details = json?.errors;
    
    // ✅ Tự động logout khi token hết hạn (401)
    if (response.status === 401) {
      // Import clearAuth từ auth store
      const { clearAuth } = await import("../stores/auth");
      clearAuth();
      
      // Chuyển về trang login (nếu không phải đang ở trang login)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    
    throw error;
  }

  // Trả về dữ liệu
  return {
    data: json?.data ?? json, // backend trả "data" hoặc toàn bộ JSON đều lấy được
    raw: json,
  };
}

export { API_BASE_URL }; 