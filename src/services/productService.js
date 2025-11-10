// src/services/productService.js
import { request } from "./http";

/* ===== Helpers ===== */
const toNumberSafe = (v) => {
  const n = Number(String(v ?? 0).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const pickUrl = (x) => {
  if (!x) return null;
  if (typeof x === "string") return x;
  // phòng khi BE trả object ảnh
  return x.url || x.src || x.link || x.href || null;
};

function pickPrice(p = {}) {
  const direct =
    p.salePrice ??
    p.sellingPrice ??
    p.currentPrice ??
    p.discountPrice ??
    p.finalPrice ??
    p.price ??
    p.unitPrice ??
    p.basePrice ??
    p.listPrice ??
    p.originalPrice ??
    p.priceVND ??
    p.amount ??
    p.value ??
    p.priceMin ??
    p.minPrice ??
    0;

  let num = toNumberSafe(direct);
  if (num > 0) return num;

  num =
    toNumberSafe(p?.priceRange?.min ?? p?.priceRange?.from) ||
    toNumberSafe(Array.isArray(p?.prices) ? p.prices[0] : 0);
  if (num > 0) return num;

  num =
    toNumberSafe(p?.variants?.[0]?.price) ||
    toNumberSafe(p?.skus?.[0]?.price) ||
    toNumberSafe(p?.options?.[0]?.price);

  return num > 0 ? num : 0;
}

/* ===== Normalizers ===== */
function normalizeProductSummary(p = {}) {
  const price = pickPrice(p);

  const productId =
    p.id ??
    p._id ??
    p.code ??
    p.product_id ??
    p.productId ??
    p.slug ??
    "";

  const firstVariantImg = pickUrl(p?.variants?.[0]?.imageUrl) || pickUrl(p?.variants?.[0]?.image);

  return {
    id: String(productId || ""),
    name: p.name ?? "Sản phẩm",
    price,
    brand: p.brand ?? null,
    imageUrl:
      pickUrl(p.imageUrl) ||
      pickUrl(p.image) ||
      pickUrl(p.thumbnail) ||
      pickUrl(p.cover) ||
      firstVariantImg ||
      pickUrl(p.images?.[0]) ||
      null,
    categoryName: p.category?.name || p.categoryName || null,
    _raw: p,
  };
}

/* ✅ Normalizer cho trang chi tiết */
function normalizeProductDetail(p = {}) {
  const base = normalizeProductSummary(p);

  // Chuẩn hoá variants
  const variants = Array.isArray(p.variants)
    ? p.variants.map((v, i) => ({
        id: v.id ?? v.variantId ?? v.sku ?? `v-${i}`,
        sku: v.sku ?? null,
        color: v.color ?? v.colour ?? "",
        size: v.size ?? "",
        price: toNumberSafe(v.price ?? v.salePrice ?? v.amount ?? 0),
        stock:
          typeof v.stock === "number"
            ? v.stock
            : (v.quantity ?? v.qty ?? null),
        imageUrl:
          pickUrl(v.imageUrl) ||
          pickUrl(v.image) ||
          pickUrl(v.photoUrl) ||
          pickUrl(v.imgUrl) ||
          null,
      }))
    : [];

  // Ảnh từ nhiều nguồn + loại rỗng + loại trùng
  const rawGallery = [
    ...(Array.isArray(p.gallery) ? p.gallery : []),
    ...(Array.isArray(p.images) ? p.images : []),
    ...variants.map((v) => v.imageUrl).filter(Boolean),
  ];
  const gallery = rawGallery
    .map(pickUrl)
    .filter(Boolean)
    .filter((url, idx, arr) => arr.indexOf(url) === idx);

  // Tập màu/size
  const colors = [
    ...(Array.isArray(p.colors) ? p.colors : []),
    ...variants.map((v) => v.color).filter(Boolean),
  ].filter(Boolean);
  const sizes = [
    ...(Array.isArray(p.sizes) ? p.sizes : []),
    ...variants.map((v) => v.size).filter(Boolean),
  ].filter(Boolean);
  const uniq = (arr) => [...new Set(arr)];

  return {
    ...base,
    description: p.description ?? "",
    categoryId: p.categoryId ?? p.category?.id ?? null,
    variants,
    colors: uniq(colors),
    sizes: uniq(sizes),
    gallery,
    imageUrl: base.imageUrl || gallery[0] || null, // đảm bảo luôn có ảnh chính
    _raw: p,
  };
}

/* ===== Services ===== */

/** GET /categories/:id/products */
export async function getProductsByCategoryId(
  categoryId,
  { page = 1, pageSize = 12, q } = {}
) {
  const params = { page, pageSize };
  if (q) params.q = q;

  const { data } = await request(`/categories/${categoryId}/products`, {
    method: "GET",
    params,
    auth: false,
  });

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];

  return {
    data: items.map(normalizeProductSummary),
    total: Number(data?.total ?? data?.count ?? items.length),
    page: Number(data?.page ?? page),
    limit: Number(data?.limit ?? pageSize),
  };
}

/** GET /products (trang Home) */
export async function getAllProducts({ page = 1, pageSize = 12, q } = {}) {
  const params = { page, pageSize };
  if (q) params.q = q;

  const { data } = await request("/products", {
    method: "GET",
    params,
    auth: false,
  });

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : [];

  return {
    data: items.map(normalizeProductSummary),
    total: Number(data?.total ?? data?.count ?? items.length),
    page: Number(data?.page ?? page),
    limit: Number(data?.limit ?? pageSize),
  };
}

/** ✅ GET /products/:id -> chi tiết đầy đủ cho ProductDetail */
export async function getProductById(id) {
  if (!id) throw new Error("Thiếu id sản phẩm");

  const { data } = await request(`/products/${id}`, {
    method: "GET",
    auth: false,
  });

  const item = data?.data ?? data ?? {};
  return normalizeProductDetail(item);
}

/** Alias for backwards compatibility */
export async function getProducts(options = {}) {
  return getAllProducts(options);
}

export { normalizeProductSummary };
