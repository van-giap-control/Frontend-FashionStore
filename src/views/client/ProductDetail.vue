<!-- src/pages/client/ProductDetail.vue -->
<template>
  <div class="detail">
    <ClientHeader />

    <main class="container">
      <div v-if="loading" class="state">Đang tải…</div>
      <div v-else-if="error" class="state state--error">{{ error }}</div>
      <div v-else-if="!product" class="state">Không tìm thấy sản phẩm.</div>

      <div v-else class="grid">
        <!-- Bên trái: Ảnh sản phẩm -->
        <section class="media">
          <div class="main-img">
            <img :src="activeImage" :alt="product?.name || 'Sản phẩm'" />
          </div>

          <div class="thumbs" v-if="gallery.length > 0">
            <button class="nav" @click="prevThumb">‹</button>

            <div class="thumbs-list">
              <img
                v-for="(img, i) in gallery"
                :key="i"
                :src="img"
                :class="{ active: i === thumbIndex }"
                @click="selectThumb(i)"
              />
            </div>

            <button class="nav" @click="nextThumb">›</button>
          </div>
        </section>

        <!-- Bên phải: Thông tin -->
        <section class="info">
          <h1 class="title">{{ product.name }}</h1>

          <div class="divider"></div>

          <!-- GIÁ -->
          <div class="price">
            <span class="price__cur">đ</span>{{ priceDigits }}
          </div>

          <div v-if="colorOptions.length" class="group">
            <label>Phân loại</label>
            <div class="chips">
              <button
                v-for="c in colorOptions"
                :key="c"
                :class="['chip', { active: c === color }]"
                @click="color = c"
              >
                {{ c }}
              </button>
            </div>
          </div>

          <div v-if="sizeOptions.length" class="group">
            <label>Size</label>
            <div class="chips">
              <button
                v-for="s in sizeOptions"
                :key="s"
                :class="['chip', { active: s === size }]"
                @click="size = s"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <div class="group">
            <label>Số lượng</label>
            <div class="qty">
              <button @click="dec" :disabled="disableDec">–</button>
              <input type="number" v-model.number="qty" min="1" :max="maxQty" />
              <button @click="inc" :disabled="disableInc">+</button>
            </div>
            <p v-if="maxQty !== null" class="qty__hint">
              <span v-if="maxQty > 0">Còn lại {{ maxQty }} sản phẩm</span>
              <span v-else>Biến thể đang tạm hết hàng</span>
            </p>
          </div>

          <div
            v-if="actionStatus.message"
            :class="['alert', `alert--${actionStatus.type}`]"
          >
            {{ actionStatus.message }}
          </div>

          <div class="actions">
            <button
              class="btn outline"
              @click="addToCart"
              :disabled="actionLoading"
            >
              <div>
                <!-- Icon giữ nguyên theo mã của bạn -->
                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 72 72"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                >
                  <rect width="40" height="40" fill="url(#pattern0_2143_611)" />
                  <defs>
                    <pattern
                      id="pattern0_2143_611"
                      patternContentUnits="objectBoundingBox"
                      width="1"
                      height="1"
                    >
                      <use
                        xlink:href="#image0_2143_611"
                        transform="scale(0.0104167)"
                      />
                    </pattern>
                    <image
                      id="image0_2143_611"
                      width="96"
                      height="96"
                      preserveAspectRatio="none"
                      xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAFTElEQVR4AeydgXXTMBCGz0xQJiBMQDMB7QTQCUgngE7QdoMyQc0E7QYNEwQmoBuUDcz90ePhPtc+Gd9JlnN6VpLasnT6P+ssn530FXnKqoADyCo/kQNwAJkVyNy8jwAHkFmBzM37CHAAmRXI3HzcCNg0K9o0D5yfODcR+Y7LrDL3rYjmZQAQn2jHvTnhfMQ5ZvnIhXYOgVUQFhkA0Q0RxQpPrYR9blt/z+fjjCyJAfBhgr3HE/Y9iF1jAPyeoMSRu6Fh9WIA/BiuQtzqo2BAohgA57z/lFGw4v196VFABlBXj7zvmvM95/9ZHMCAajIA7AwIdXVGdVV1MhFGCA0kBzAgThyAgQp4k3SOeMdlfOlRQAMAXFRP9fvVK54JHe0/+UtHgekA6gonaBlCp2lfAQWmA0AtRD/DW+/rce+WA9+gBSBiBBy40j3dTwXgTU/7B786FQB3QT2HmhYAaSp6zDOh5oDyHfc16vpHBwAu1IgwGyJPewWi74foANi3SdKJmA4s4drnVuqzJgBpKirZssTt4rlPE4CPgO4hhFHQXdta4wBaYhh83Ep1agKQZkKSLUvc/k3qlCYAd0FdtbfdVc/X6AGIC8qt6aV7CiWuI5Lcy5bC9JyGkh6A0Io0ExJnBaGamb+GZ6XwnNSQoaL7wc7aACQ3FHV1CMNmniXxYb40QlBG/QsaEoClBOU+7dXrf4lyP9g99Qgo3wUpuh8LANJUdAkuSM396AMIZ/2hoNxRbJQQxs00q7kf9E/bBaFO6TxQrhtSdj8QywKANBVdoeFCs6r7gQYWAKQRUDIAVfezXADomXY2cD8w0WIESDOhUp+UU3c/VgBkF7RpxDg5jJtZVnc/6J/+CIgLypV1HjByPzYAUOvynpQzcT+QSn8EoFYi2Q1RUcnE/UCBXADKCcoZup+cAEq6GjZzP5YApKloSSdhM/djB2ApQTlj92MHADXLJ+IS3JCp+4FMiidhVPcsLyEoZ+p+oJYlgLKnogncjwOAAv3Z3P2gacsRIM2E5huUC0f/JQQayNE33gfqUH8qot2W7ILmGJQLNuFXAaSpctRzP21BXvpsNwJKDMptGszMdiyUNDofqa5qUkh2AIJx0kwIHQ4lc73iiN80J7Rp7tgEiC8d+VyMVI5+VGQNQHJDt9zxJmsmemIhHjjja0X8Ji44+q/EUpEFcgOINHNWxc40rXEA49S8prqSZnc0JlkDUDV2TMcMykL8juuZ2o4tADkoN9X+FPvjSb8Lqit18YmTLQBugJeSRwEeMceXSm64HyZLCgDnbDmOIn4rZoHwp1RXyNJMjqYkewDBDU35zbkp/YvZFwcHRL7nwhec31IQHhDIOtkDQA8Aoe835/J/P+w11RVEP+P3G86AQalSGgCpelNgOw4gMzQHcDAAQtDrkuM++D8Ef+M/O/57k1mDl5tPZG+aERBucOy4p7iYad9pQjQUAblfDCImCslVJFgS2psGABGijUMCYxtGRtxT0/YMktlrD2DTwMVAYEk2lPkiFTLfntheewBEn0eI9n5EWauiSe1NAQB+Plas9vkhdh/tckntTQFAW6BF1ZcCwHaEYnOInCa1NwWA7yMAfB1R1qpoUntTAEAsPSbA9UhKj3rQtJTUXnsA4fmgU9ZkCAK2oQwXy7wkttceAPQM4ei3/BE3Z9p+Hv72mtevCWVoJgm2IERNdM4WmdqbBgD3Yr/AxdTVmv7dA8Adpyv+GzdFaHYpgb0jAMxOnkUY5AAyY3QADiCzApmb9xHgADIrkLl5HwEOILMCmZv3EeAAMiuQuXkfAQIA681/AAAA//9KEEMIAAAABklEQVQDAIUfWt8tp7OxAAAAAElFTkSuQmCC"
                    />
                  </defs>
                </svg>
              </div>

              <h3>Thêm vào giỏ hàng</h3>
            </button>

            <button
              class="btn primary"
              @click="buyNow"
              :disabled="actionLoading"
            >
              Mua ngay
            </button>
          </div>
        </section>
      </div>

      <!-- MÔ TẢ SẢN PHẨM -->
      <section class="desc">
        <h2 class="desc__title">MÔ TẢ SẢN PHẨM</h2>
        <div v-if="descriptionParagraphs.length" class="desc__content">
          <p v-for="(line, index) in descriptionParagraphs" :key="index">
            {{ line }}
          </p>
        </div>
        <p v-else class="desc__empty">Chưa có mô tả chi tiết cho sản phẩm này.</p>
      </section>

      <!-- =================== ĐÁNH GIÁ SẢN PHẨM =================== -->
      <section class="reviews">
        <h2 class="reviews__title">ĐÁNH GIÁ SẢN PHẨM</h2>

        <div v-if="reviewLoading" class="state">Đang tải đánh giá…</div>
        <div v-else-if="reviewError" class="state state--error">{{ reviewError }}</div>
        <div v-else-if="!pagedReviews.length" class="state">Chưa có đánh giá nào.</div>

        <!-- Danh sách đánh giá -->
        <div
          v-for="r in pagedReviews"
          :key="r.id"
          class="review-card"
        >
          <div class="review-card__left">
            <div class="avatar">
              <img
                v-if="r.avatarUrl"
                :src="r.avatarUrl"
                alt="Avatar người dùng"
                class="avatar-img"
              />
              <svg
                v-else
                viewBox="0 0 24 24"
                width="22"
                height="22"
                stroke="currentColor"
                fill="none"
                stroke-width="1.5"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>

            <div class="info">
              <div class="name">{{ r.name }}</div>
              <div class="stars">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="star"
                  :class="{ on: i <= r.rating }"
                >★</span>
              </div>
              <p class="text">
                {{ r.text }}
              </p>

              <!-- Ảnh review -->
              <div v-if="r.photos && r.photos.length" class="review-photos">
                <img
                  v-for="(p, idx) in r.photos"
                  :key="idx"
                  :src="p"
                  alt="Ảnh đánh giá"
                  class="review-photo"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Phân trang -->
        <nav class="pagination" v-if="totalPages > 1">
          <button class="page-nav" :disabled="page === 1" @click="go(page - 1)">‹</button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="page"
            :class="{ active: p === page }"
            @click="go(p)"
          >
            {{ p }}
          </button>
          <button class="page-nav" :disabled="page === totalPages" @click="go(page + 1)">›</button>
        </nav>
      </section>
    </main>

    <ClientFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// Components
import ClientHeader from "../../components/client/ClientHeaderLogged.vue";
import ClientFooter from "../../components/client/ClientFooter.vue";

// Services
import { getProductById } from "../../services/productService";
import { addItem } from "../../services/cartService";
import { useAuthStore } from "../../stores/auth";
import { getReviewsByProductId } from "../../services/reviewService";
import { useCart } from "../../services/cartService";

const route = useRoute();
const router = useRouter();

// Cart service để lấy cart state sau khi thêm sản phẩm
const { cartState, fetchCart } = useCart();

/* ===== State ===== */
const product = ref(null);
const loading = ref(true);
const error = ref("");

const color = ref("");
const size = ref("");
const qty = ref(1);

const thumbIndex = ref(0);
const actionStatus = ref({ type: "info", message: "" });
const actionLoading = ref(false);

/* ===== Auth (Pinia) ===== */
const auth = useAuthStore();
const isLoggedIn = computed(() => auth.isLoggedIn);

/* ===== Computed dữ liệu sản phẩm ===== */
const gallery = computed(() => product.value?.gallery || []);
const colorOptions = computed(() => product.value?.colors || []);
const variants = computed(() => product.value?.variants || []);
const sizeOptions = computed(() => {
  if (!product.value?.variants) return [];
  if (!color.value) return product.value.sizes || [];
  const sizes = product.value.variants
    .filter((v) => !v.color || v.color === color.value)
    .map((v) => v.size)
    .filter((s, i, arr) => s && arr.indexOf(s) === i);
  return sizes.length ? sizes : product.value.sizes || [];
});

/* Ảnh đang hiển thị */
const activeImage = computed(() =>
  gallery.value[thumbIndex.value] ||
  product.value?.image ||
  product.value?.thumbnail ||
  ""
);

/* Mô tả */
const descriptionParagraphs = computed(() => {
  const raw = product.value?.description || "";
  return String(raw)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
});

/* Giá hiển thị */
const selectedVariant = computed(() => {
  if (!variants.value.length) return null;
  return (
    variants.value.find(
      (v) =>
        (!color.value || v.color === color.value) &&
        (!size.value || v.size === size.value)
    ) || variants.value[0]
  );
});

const displayPrice = computed(
  () => selectedVariant.value?.price || product.value?.price || 0
);

const priceDigits = computed(() =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
    Math.round(displayPrice.value || 0)
  )
);

/* Tồn kho & số lượng */
const maxQty = computed(() => {
  const s = selectedVariant.value?.stock;
  return typeof s === "number" && s >= 0 ? s : null; // null = không giới hạn
});
const disableInc = computed(() => maxQty.value !== null && qty.value >= maxQty.value);
const disableDec = computed(() => qty.value <= 1);

function inc() { if (!disableInc.value) qty.value += 1; }
function dec() { if (!disableDec.value) qty.value -= 1; }

watch(qty, (v) => {
  let n = Math.floor(Number(v) || 1);
  if (n < 1) n = 1;
  if (maxQty.value !== null && n > maxQty.value) n = maxQty.value;
  if (n !== qty.value) qty.value = n;
});

/* ===== Gallery điều hướng ===== */
function selectThumb(i) {
  if (i >= 0 && i < gallery.value.length) thumbIndex.value = i;
}
function prevThumb() {
  const len = gallery.value.length; if (!len) return;
  thumbIndex.value = (thumbIndex.value - 1 + len) % len;
}
function nextThumb() {
  const len = gallery.value.length; if (!len) return;
  thumbIndex.value = (thumbIndex.value + 1) % len;
}

/* ===== Actions ===== */
function resetActionStatus() {
  actionStatus.value = { type: "info", message: "" };
}

async function performCartAction(redirectToCart = false) {
  if (!product.value) return;
  resetActionStatus();

  if (!isLoggedIn.value) {
    actionStatus.value = { type: "warning", message: "Vui lòng đăng nhập để mua hàng." };
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  const variantId = Number(selectedVariant.value?.id);
  if (!variantId) {
    actionStatus.value = { type: "error", message: "Không tìm thấy biến thể phù hợp." };
    return;
  }

  if (maxQty.value === 0) {
    actionStatus.value = { type: "error", message: "Biến thể này đã hết hàng." };
    return;
  }

  const safeQty = Math.max(1, Number.parseInt(qty.value, 10) || 1);
  const quantity = maxQty.value !== null ? Math.min(safeQty, maxQty.value || 1) : safeQty;

  actionLoading.value = true;
  try {
    // giữ nguyên logic thêm giỏ
    await addItem(variantId, quantity);
    actionStatus.value = { type: "success", message: "Sản phẩm đã được thêm vào giỏ hàng." };
    if (redirectToCart) router.push({ path: "/cart" });
  } catch (err) {
    console.error("Lỗi thêm giỏ:", err);
    actionStatus.value = { type: "error", message: err?.message || "Không thể thêm vào giỏ hàng." };
  } finally {
    actionLoading.value = false;
  }
}

function addToCart() { performCartAction(false); }

/* >>> MUA NGAY: điều hướng thẳng sang checkout, chỉ hiển thị sản phẩm vừa mua <<< */
async function buyNow() {
  if (!isLoggedIn.value) {
    actionStatus.value = { type: "warning", message: "Vui lòng đăng nhập để mua hàng." };
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  const variantId = Number(selectedVariant.value?.id);
  if (!variantId) {
    actionStatus.value = { type: "error", message: "Không tìm thấy biến thể phù hợp." };
    return;
  }

  const safeQty = Math.max(1, Number.parseInt(qty.value, 10) || 1);

  actionLoading.value = true;
  try {
    await addItem(variantId, safeQty); // ✅ thêm sản phẩm vào giỏ
    
    // Sau khi thêm thành công, lấy cart mới để tìm item vừa thêm
    await fetchCart();
    
    // Tìm item trong giỏ có variantId vừa thêm
    const cartItem = cartState.items?.find(item => 
      item.productVariantId === variantId || item.variantId === variantId
    );
    
    if (cartItem?.id) {
      // Chuyển sang checkout với ID của item vừa thêm
      router.push({ 
        path: "/checkout", 
        query: { 
          source: "buynow",
          selected: String(cartItem.id) // ✅ Truyền ID của item vừa thêm
        } 
      });
    } else {
      // Fallback: nếu không tìm thấy, vẫn chuyển nhưng hiển thị toàn bộ
      router.push({ path: "/checkout", query: { source: "buynow" } });
    }
  } catch (err) {
    console.error("Lỗi khi mua ngay:", err);
    actionStatus.value = { type: "error", message: err?.message || "Không thể mua ngay." };
  } finally {
    actionLoading.value = false;
  }
}


/* ===== Load sản phẩm ===== */
async function loadProduct() {
  loading.value = true;
  try {
    const id = route.params.id;
    const data = await getProductById(id);
    product.value = data || null;
    color.value = data?.colors?.[0] || "";
    size.value = data?.sizes?.[0] || "";
    thumbIndex.value = 0;
    resetActionStatus();
  } catch (e) {
    error.value = e?.message || "Không tải được sản phẩm.";
  } finally {
    loading.value = false;
  }
}

/* ====================== PHẦN REVIEW ====================== */
const reviews = ref([]);
const page = ref(1);
const pageSize = 3;
const totalReviews = ref(0);
const reviewLoading = ref(false);
const reviewError = ref("");

const totalPages = computed(() => {
  const t = Math.ceil((totalReviews.value || 0) / pageSize);
  return t > 0 ? t : 1;
});

const pagedReviews = computed(() => reviews.value);

function normalizeReviews(arr = []) {
  return arr.map((r, idx) => {
    const user = r.user || r.account || r.author || r.createdBy || r.customer || null;

    const name =
      user?.fullName ||
      user?.name ||
      user?.displayName ||
      user?.username ||
      r.userName ||
      r.authorName ||
      r.name ||
      (user?.email ? user.email.split("@")[0] : null) ||
      (r.email ? r.email.split("@")[0] : null) ||
      "Ẩn danh";

    const avatarUrl =
      user?.avatarUrl ||
      user?.photoUrl ||
      r.avatarUrl ||
      r.userAvatar ||
      r.avatar ||
      "";

    const photos = Array.isArray(r.photos)
      ? r.photos
      : r.photo
      ? [r.photo]
      : r.imageUrl
      ? [r.imageUrl]
      : r.photoUrl
      ? [r.photoUrl]
      : [];

    return {
      id: r.id ?? r.reviewId ?? `${r.userId ?? "u"}-${r.createdAt ?? idx}`,
      name,
      avatarUrl,
      rating: Number(r.rating ?? r.stars ?? 0),
      text: r.comment ?? r.content ?? r.text ?? "",
      photos
    };
  });
}

async function loadReviews() {
  reviewLoading.value = true;
  reviewError.value = "";
  try {
    const productId = route.params.id;
    const res = await getReviewsByProductId(productId, { page: page.value, pageSize });

    const payload = res?.data ?? res;
    const list =
      res?.items ??
      payload?.items ??
      payload?.results ??
      payload?.data ??
      (Array.isArray(payload) ? payload : []);

    const total =
      (typeof res?.total === "number" ? res.total : undefined) ??
      (typeof payload?.total === "number" ? payload.total : undefined) ??
      (typeof payload?.count === "number" ? payload.count : undefined) ??
      list.length;

    reviews.value = normalizeReviews(list);
    totalReviews.value = total || 0;
  } catch (e) {
    console.error("Không tải được đánh giá sản phẩm:", e);
    reviewError.value = e?.message || "Không tải được đánh giá sản phẩm.";
    reviews.value = [];
    totalReviews.value = 0;
  } finally {
    reviewLoading.value = false;
  }
}

function go(p) {
  if (p < 1 || p > totalPages.value || p === page.value) return;
  page.value = p;
  loadReviews();
}

/* ===== Mounted & watchers ===== */
onMounted(() => {
  loadProduct();
  loadReviews();
});

watch(() => route.params.id, () => {
  page.value = 1;
  loadReviews();
});

watch(selectedVariant, () => {
  qty.value = 1;
  resetActionStatus();
}, { immediate: true });

watch(qty, (value, oldValue) => {
  if (value === oldValue) return;
  if (value < 1) qty.value = 1;
  if (maxQty.value !== null && qty.value > maxQty.value) {
    qty.value = maxQty.value || 1;
  }
  resetActionStatus();
});

watch([color, size], () => {
  resetActionStatus();
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Khula:wght@400;600;700&display=swap");

.detail {
  font-family: "Khula", sans-serif;
  background: #fff;
}

.container {
  max-width: 1200px;
  margin: 24px auto 40px;
  padding: 0 24px;
}

.state {
  text-align: center;
  padding: 24px 0;
  color: #4b5563;
}
.state--error { color: #b91c1c; }

/* ===== Grid ===== */
.grid {
  display: grid;
  grid-template-columns: 520px 1fr;
  gap: 200px;
  align-items: start;
}
@media (max-width: 992px) {
  .grid { grid-template-columns: 1fr; }
}

/* ===== Ảnh chính ===== */
.main-img {
  background: #18181b;
  padding: 8px;
  border-radius: 8px;
}
.main-img img {
  width: 100%;
  display: block;
  border-radius: 6px;
  max-height: 480px;
}

/* ===== Gallery nhỏ ===== */
.thumbs {
  display: grid;
  grid-template-columns: 28px 1fr 28px;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}
.nav {
  height: 60px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 22px;
  cursor: pointer;
}
.thumbs-list {
  display: grid;
  grid-auto-flow: column;
  gap: 8px;
  overflow: auto;
  padding: 6px 2px;
  background: #f8fafc;
  border-radius: 8px;
}
.thumbs-list img {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  opacity: 0.75;
  cursor: pointer;
  border: 2px solid transparent;
}
.thumbs-list img.active {
  opacity: 1;
  border-color: #1e2cff;
}

/* ===== Thông tin ===== */
.title {
  font-weight: 700;
  font-size: 22px;
  color: #111827;
  margin: 6px 0 10px;
  line-height: 1.4;
}
.divider {
  height: 1.5px;
  background: #e5e7eb;
  margin: 8px 0 12px;
}

/* ===== Giá ===== */
.price {
  font-size: 32px;
  font-weight: 800;
  color: #ef4444;           /* đỏ */
  background: #eaf2ff;      /* xanh nhạt */
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 6px;
  letter-spacing: .2px;
}
.price__cur {
  font-size: 0.9em;
  line-height: 1;
  text-decoration: underline;
  margin-right: 2px;
}

/* ===== Chips ===== */
.group { margin-top: 18px; }
.group label {
  display: block;
  margin-bottom: 6px;
  color: #374151;
  font-weight: 600;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  min-width: 72px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-weight: 600;
}
.chip.active {
  border-color: #1e2cff;
  box-shadow: 0 0 0 3px rgba(30, 44, 255, 0.15);
}

/* ===== Số lượng ===== */
.qty { display: flex; align-items: center; }
.qty input {
  width: 64px;
  height: 40px;
  border: 1px solid #e5e7eb;
  text-align: center;
  margin: 0 -1px;
}
.qty button {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  border-radius: 6px;
}
.qty button:disabled { cursor: not-allowed; opacity: 0.5; }
.qty__hint { margin-top: 6px; color: #6b7280; font-size: 13px; }

.alert {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}
.alert--success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.alert--error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.alert--warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.alert--info { background: #e0f2fe; color: #0c4a6e; border: 1px solid #bae6fd; }

/* ===== Nút hành động ===== */
.actions {
  margin-top: 22px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.btn {
  border: none;
  border-radius: 10px;
  height: 48px;
  padding: 0 22px;
  font-weight: 700;
  cursor: pointer;
}
.btn.outline { background: #ebf2ff; color: #e60000; border: 1px solid #4c80e6; display: flex; }
.btn.primary { background: #ef4444; color: #fff; }
.btn.outline:hover { background: #cedfff; }
.btn.primary:hover { background: #dc2626; }

/* ===== MÔ TẢ SẢN PHẨM ===== */
.desc {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}
.desc__title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: .3px;
}
.desc__subtitle {
  font-size: 14.5px;
  font-weight: 800;
  color: #111827;
  margin: 18px 0 8px;
  text-transform: uppercase;
}
.desc__content {
  display: grid;
  gap: 10px;
  color: #374151;
  line-height: 1.7;
  font-size: 14px;
}
.desc__empty { color: #9ca3af; font-style: italic; font-size: 14px; }

/* Bảng biến thể – nếu dùng */
.variants {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 14px;
}
.variants th,
.variants td {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
}
.variants th { background: #f9fafb; font-weight: 700; color: #111827; }
.variants td { color: #374151; }

/* ===== ĐÁNH GIÁ SẢN PHẨM ===== */
.reviews {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 2px solid #ffffff;
}
.reviews__title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: .3px;
}

/* Card review */
.review-card {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 16px;
}
.review-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.08);
}
.review-card__left {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  align-items: start;
}

/* Avatar */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #9ca3af;
  display: grid;
  place-items: center;
  border: 1px solid #e5e7eb;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
}

/* Cột thông tin: tên, sao, text */
.info { display: grid; gap: 6px; }
.name { font-weight: 700; font-size: 14px; color: #374151; }
.stars { line-height: 1; }
.star { font-size: 14px; color: #d1d5db; margin-right: 2px; }
.star.on { color: #f59e0b; }

/* Nội dung review */
.text {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Ảnh đính kèm */
.review-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  margin-top: 8px;
}
.review-photo {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Phân trang */
.pagination {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.page,
.page-nav {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-weight: 700;
  cursor: pointer;
}
.page:hover,
.page-nav:hover { background: #f3f4f6; }
.page.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
  cursor: default;
}
.page.dots {
  cursor: default;
  font-weight: 600;
  pointer-events: none;
  background: #fff;
  border-color: transparent;
}
.page-nav:disabled { opacity: .45; cursor: not-allowed; }

/* Responsive */
@media (max-width: 640px) {
  .review-card { grid-template-columns: 1fr; gap: 12px; }
  .review-photo { width: 64px; height: 64px; justify-self: start; }
}
</style>
