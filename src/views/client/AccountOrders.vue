<!-- src/views/client/AccountOrders.vue -->
<template>
  <div class="account">
    <ClientHeader />

    <main class="page" role="main">
      <div class="container">
        <div class="grid">
          <!-- Sidebar -->
          <AccountSidebar :username="username" />

          <!-- Đơn Mua -->
          <section class="orders-card" aria-labelledby="orders-title">
            <!-- Tabs -->
            <div class="orders-tabs">
              <nav class="orders-tabs__nav" role="tablist" aria-label="Trạng thái đơn">
                <button
                  v-for="t in tabs"
                  :key="t.key"
                  class="orders-tab"
                  :class="{ 'is-active': activeTab === t.key }"
                  @click="goTab(t.key)"
                >
                  {{ t.label }}
                </button>
              </nav>
            </div>

            <!-- Nội dung -->
            <div class="orders-body">
              <p v-if="loading" class="state">Đang tải đơn hàng…</p>
              <p v-else-if="errorMessage" class="state state--error">{{ errorMessage }}</p>

              <!-- Empty state với icon -->
              <div v-else-if="orders.length === 0" class="empty-state">
                <svg class="empty-icon" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="30" y="40" width="60" height="50" rx="4" fill="#E0E7FF" stroke="#6366F1" stroke-width="2"/>
                  <path d="M40 50h40M40 60h30M40 70h35" stroke="#6366F1" stroke-width="2" stroke-linecap="round"/>
                  <path d="M75 35l10 10-10 10" stroke="#FFA500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="85" cy="45" r="3" fill="#FFA500"/>
                </svg>
                <p class="empty-text">{{ emptyText }}</p>
              </div>

              <ul v-else class="olist" role="list">
                <li v-for="o in orders" :key="o.id || o.orderId" class="oitem">
                  <!-- Hàng 1 -->
                  <div class="oitem__row oitem__row--top">
                    <img :src="o.items?.[0]?.image" alt="" class="thumb" />
                    <div class="meta">
                      <h3 class="name">{{ o.items?.[0]?.name }}</h3>
                      <p class="sub">Phân loại: {{ o.items?.[0]?.variant }}</p>
                      <p class="sub">x{{ o.items?.[0]?.qty }}</p>
                    </div>
                    <div class="price-right">{{ formatVND(o.total) }}</div>
                  </div>

                  <div class="divider"></div>

                  <!-- Hàng 2 -->
                  <div class="oitem__row oitem__row--bot">
                    <div class="status-left">
                      <span class="ship" v-if="o.status === 'COMPLETED'">
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 7h13v10H3zM16 10h4l1 2v5h-5z"
                                fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Giao hàng thành công
                      </span>
                      <span v-if="o.status !== 'CANCELLED' && o.status !== 'RETURNED'" class="ship-status" :class="`ss--${o.status}`">
                        {{ shipStatusText(o.status) }}
                      </span>
                      <span v-if="o.status === 'COMPLETED'" class="dot"></span>
                      <span class="status-text" :class="`st--${o.status}`">
                        {{ statusText(o.status) }}
                      </span>
                    </div>

                    <div class="actions">
                      <!-- Chờ xác nhận -->
                      <button
                        v-if="o.status === 'PENDING'"
                        class="btn-action btn-contact"
                        @click="onContact(o)"
                      >
                        Chờ xác nhận
                      </button>
                      <button
                        v-if="o.status === 'PENDING'"
                        class="btn-action btn-cancel"
                        @click="onCancel(o)"
                      >
                        Hủy đơn hàng
                      </button>

                      <!-- Đã hủy -->
                      <button
                        v-if="o.status === 'CANCELLED'"
                        class="btn-action btn-cancel disabled"
                        disabled
                      >
                        Đã Hủy
                      </button>

                      <!-- Đã đặt hàng -->
                      <button
                        v-if="o.status === 'ORDERED'"
                        class="btn-action btn-buy-again"
                        @click="onBuyAgain(o)"
                      >
                        Mua lại
                      </button>
                      <button
                        v-if="o.status === 'ORDERED'"
                        class="btn-action btn-contact"
                        @click="onContact(o)"
                      >
                        Liên hệ người bán
                      </button>

                      <!-- Hoàn thành -->
                      <button
                        v-if="o.status === 'COMPLETED'"
                        class="btn-action btn-rate"
                        @click="onRate(o)"
                      >
                        Đánh giá
                      </button>

                      <!-- Trả hàng -->
                      <button
                        v-if="o.status === 'RETURNED'"
                        class="btn-action btn-cancel disabled"
                        disabled
                      >
                        Đã Hủy
                      </button>

                      <!-- Đang vận chuyển -->
                      <button
                        v-if="o.status === 'SHIPPING'"
                        class="btn-action btn-contact"
                        @click="onContact(o)"
                      >
                        Liên hệ người bán
                      </button>
                    </div>

                    <div class="total">
                      <span class="total__label">Thành Tiền:</span>
                      <strong class="total__val">{{ formatVND(o.total) }}</strong>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>

    <ClientFooter />

    <!-- ✅ Popup đánh giá sản phẩm -->
    <div v-if="showRatingPopup" class="popup-overlay" @click.self="closeRatingPopup">
      <div class="popup-card">
        <div class="popup-header">
          <h3>Đánh Giá popup</h3>
          <button class="popup-close" @click="closeRatingPopup">×</button>
        </div>
        
        <div class="popup-body">
          <div class="rating-product">
            <img :src="currentOrder?.items?.[0]?.image" alt="" class="rating-thumb" />
            <div>
              <h4 class="rating-name">{{ currentOrder?.items?.[0]?.name }}</h4>
              <p class="rating-variant">Phân loại: {{ currentOrder?.items?.[0]?.variant }}</p>
              <p class="rating-qty">x{{ currentOrder?.items?.[0]?.qty }}</p>
            </div>
          </div>

          <div class="rating-section">
            <label class="rating-label">Chất lượng sản phẩm</label>
            <div class="stars">
              <button
                v-for="n in 5"
                :key="n"
                class="star"
                :class="{ active: rating >= n }"
                @click="rating = n"
              >
                ★
              </button>
            </div>
          </div>

          <div class="rating-section">
            <textarea
              v-model="reviewComment"
              class="rating-textarea"
              placeholder="Hãy chia sẻ những điểm bạn thích về sản phẩm này với những người mua khác nhé."
              rows="4"
            ></textarea>
          </div>

          <div class="rating-section">
            <label class="rating-upload">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Thêm hình ảnh
              <input type="file" accept="image/*" style="display:none" @change="onImageUpload" />
            </label>
            <div v-if="uploadedImages.length" class="image-previews">
              <div v-for="(img, idx) in uploadedImages" :key="idx" class="image-preview">
                <img :src="img" alt="" />
                <button class="remove-img" @click="removeImage(idx)">×</button>
              </div>
            </div>
          </div>
        </div>

        <div class="popup-footer">
          <button class="btn-popup btn-back" @click="closeRatingPopup">Trở lại</button>
          <button class="btn-popup btn-submit" @click="submitRating">Hoàn thành</button>
        </div>
      </div>
    </div>

    <!-- ✅ Popup hủy đơn hàng -->
    <div v-if="showCancelPopup" class="popup-overlay" @click.self="closeCancelPopup">
      <div class="popup-card popup-cancel">
        <h3 class="cancel-title">Chọn lý do hủy</h3>
        
        <div class="cancel-reasons">
          <label v-for="(reason, idx) in cancelReasons" :key="idx" class="cancel-reason">
            <input type="radio" :value="reason" v-model="cancelReason" />
            <span>{{ reason }}</span>
          </label>
        </div>

        <div class="cancel-footer">
          <button class="btn-popup btn-back" @click="closeCancelPopup">Thoát</button>
          <button class="btn-popup btn-submit" @click="submitCancel">HỦY ĐƠN HÀNG</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { request } from "../../services/http";

import ClientHeader from "../../components/client/ClientHeaderLogged.vue";
import ClientFooter from "../../components/client/ClientFooter.vue";
import AccountSidebar from "../../components/client/AccountSidebar.vue";

const ORDERS_ENDPOINT = "/orders/mine";

const username = localStorage.getItem("username") || "Khách hàng";
const route = useRoute();
const router = useRouter();

const tabs = [
  { key: "all",        label: "Tất cả" },
  { key: "PENDING",    label: "Chờ xác nhận" },
  { key: "SHIPPING",   label: "Vận Chuyển" },
  { key: "COMPLETED",  label: "Hoàn thành" },
  { key: "CANCELLED",  label: "Đã hủy" },
  { key: "RETURNED",   label: "Trả hàng" },
];
const activeTab = ref(route.query.tab?.toString() || "all");

const loading = ref(false);
const errorMessage = ref("");
const orders = ref([]);

// ✅ Popup đánh giá
const showRatingPopup = ref(false);
const currentOrder = ref(null);
const rating = ref(5);
const reviewComment = ref("");
const uploadedImages = ref([]);

// ✅ Popup hủy đơn
const showCancelPopup = ref(false);
const cancelReason = ref("");
const cancelReasons = [
  "Muốn thay đổi địa chỉ giao hàng",
  "Muốn thay đổi sản phẩm trong đơn (size, màu sắc, số lượng...)",
  "Tìm thấy giá rẻ hơn ở chỗ khác",
  "Đổi ý, không muốn mua nữa",
  "Khác"
];

// ✅ Empty state text
const emptyText = computed(() => {
  const texts = {
    all: "Chưa có đơn hàng",
    PENDING: "Chưa có đơn hàng",
    SHIPPING: "Chưa có đơn hàng",
    COMPLETED: "Chưa có đơn hàng",
    CANCELLED: "Chưa có đơn hàng",
    RETURNED: "Bạn hiện không có yêu cầu trả hàng nào"
  };
  return texts[activeTab.value] || "Chưa có đơn hàng";
});

watch(
  () => route.query.tab,
  () => {
    activeTab.value = route.query.tab?.toString() || "all";
    fetchOrders();
  }
);

async function fetchOrders() {
  try {
    loading.value = true;
    errorMessage.value = "";

    const params = activeTab.value === "all" ? {} : { status: activeTab.value };

    const res = await request(ORDERS_ENDPOINT, { method: "GET", params });
    
    const list = Array.isArray(res.data) 
      ? res.data 
      : res.data?.orders || res.data?.items || [];
    
    orders.value = (Array.isArray(list) ? list : []).map(order => {
      const orderItems = order.orderItems || order.items || [];
      
      return {
        id: order.id,
        orderId: order.id,
        code: order.code,
        status: order.status,
        total: order.total || order.grandTotal || 0,
        createdAt: order.createdAt,
        items: orderItems.map(item => ({
          productId: item.productVariant?.productId || item.productId,
          name: item.productVariant?.product?.name || item.name || 'Sản phẩm',
          variant: [item.productVariant?.color, item.productVariant?.size].filter(Boolean).join(', ') || '',
          qty: item.quantity || 1,
          image: item.productVariant?.imageUrl || 
                 item.productVariant?.product?.images?.[0]?.url ||
                 '/placeholder.png'
        }))
      };
    });
  } catch (err) {
    if (err.status === 403) {
      errorMessage.value = "Bạn không có quyền truy cập danh sách đơn hàng.";
    } else if (err.status === 404) {
      errorMessage.value = "Không tìm thấy endpoint dữ liệu đơn hàng.";
    } else {
      errorMessage.value = err.message || "Không thể tải đơn hàng.";
    }
    orders.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchOrders);

function goTab(key) {
  router.replace({ query: { tab: key } });
}

function statusText(s) {
  return (
    {
      ORDERED: "ĐÃ ĐẶT HÀNG",
      PENDING: "CHỜ XÁC NHẬN",
      SHIPPING: "ĐANG VẬN CHUYỂN",
      COMPLETED: "HOÀN THÀNH",
      CANCELLED: "ĐÃ HỦY",
      RETURNED: "ĐÃ HỦY",
    }[s] || "—"
  );
}

function shipStatusText(s) {
  return (
    {
      ORDERED: "Đơn hàng đã được đặt",
      PENDING: "Chờ xác nhận",
      SHIPPING: "Đang giao hàng",
      COMPLETED: "Giao hàng thành công",
    }[s] || ""
  );
}

function formatVND(n) {
  if (n == null) return "0₫";
  return Number(n).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

// ✅ Hủy đơn hàng
function onCancel(order) {
  currentOrder.value = order;
  cancelReason.value = "";
  showCancelPopup.value = true;
}

function closeCancelPopup() {
  showCancelPopup.value = false;
  currentOrder.value = null;
  cancelReason.value = "";
}

async function submitCancel() {
  if (!cancelReason.value) {
    alert("Vui lòng chọn lý do hủy đơn");
    return;
  }
  
  try {
    await request(`/orders/${currentOrder.value.id}/cancel`, {
      method: "POST",
      data: { reason: cancelReason.value }
    });
    
    alert("Đã hủy đơn hàng thành công!");
    closeCancelPopup();
    fetchOrders();
  } catch (err) {
    alert(err.message || "Không thể hủy đơn hàng");
  }
}

// ✅ Đánh giá sản phẩm
function onRate(order) {
  currentOrder.value = order;
  rating.value = 5;
  reviewComment.value = "";
  uploadedImages.value = [];
  showRatingPopup.value = true;
}

function closeRatingPopup() {
  showRatingPopup.value = false;
  currentOrder.value = null;
  rating.value = 5;
  reviewComment.value = "";
  uploadedImages.value = [];
}

function onImageUpload(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedImages.value.push(ev.target.result);
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function removeImage(idx) {
  uploadedImages.value.splice(idx, 1);
}

async function submitRating() {
  if (!reviewComment.value.trim()) {
    alert("Vui lòng nhập nhận xét của bạn");
    return;
  }

  try {
    const productId = currentOrder.value.items[0]?.productId;
    if (!productId) {
      alert("Không tìm thấy thông tin sản phẩm");
      return;
    }

    await request(`/products/${productId}/reviews`, {
      method: "POST",
      data: {
        rating: rating.value,
        comment: reviewComment.value
      }
    });

    alert("Cảm ơn bạn đã đánh giá!");
    closeRatingPopup();
    fetchOrders();
  } catch (err) {
    alert(err.message || "Không thể gửi đánh giá");
  }
}

// ✅ Liên hệ người bán
function onContact(order) {
  alert(`Liên hệ người bán cho đơn hàng #${order.code}\nTính năng đang phát triển.`);
}

// ✅ Mua lại
function onBuyAgain(order) {
  router.push({ name: 'home' });
}

// ✅ Yêu cầu trả hàng
async function onReturn(order) {
  if (!confirm(`Bạn có chắc muốn trả hàng cho đơn #${order.code}?`)) return;
  
  try {
    const reason = prompt("Lý do trả hàng:");
    if (!reason) {
      alert("Vui lòng nhập lý do trả hàng");
      return;
    }
    
    await request(`/orders/${order.id}/return`, {
      method: "POST",
      data: { reason }
    });
    
    alert("Yêu cầu trả hàng đã được gửi!");
    fetchOrders();
  } catch (err) {
    alert(err.message || "Không thể gửi yêu cầu trả hàng");
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Khula:wght@400;600;700;800&display=swap");
:host, * { font-family: "Khula", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }

:root { --red:#EF4444; --blue:#4C80E6; --text:#111827; --muted:#6B7280; --border:#E5E7EB; --border-2:#E9E9E9; }

/* layout */
.page{padding:16px 0 32px}
.container{max-width:1100px;margin:0 auto;padding:0 12px}
.grid{display:grid;grid-template-columns:260px 1fr;gap:16px}

/* card + tabs */
.orders-card{background:#fff;border:1px solid var(--border);border-radius:8px;overflow:hidden}
.orders-tabs{border-bottom:2px solid var(--border-2)}
.orders-tabs__nav{display:flex;gap:0;height:48px;padding:0 20px}
.orders-tab{position:relative;background:transparent;border:0;cursor:pointer;padding:0 20px;margin:0;color:#222;font-weight:600;font-size:16px;line-height:48px;transition:all .2s}
.orders-tab.is-active{color:var(--red)}
.orders-tab.is-active::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--red)}
.orders-tab:not(.is-active):hover{color:var(--red)}

.orders-body{padding:12px 16px}
.state{padding:16px;text-align:center;color:var(--muted)}
.state--error{color:#b91c1c}

/* ✅ Empty state với icon */
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:16px}
.empty-icon{width:120px;height:120px}
.empty-text{margin:0;font-size:16px;color:var(--muted)}

/* list */
.olist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.oitem{border:1px solid var(--border);border-radius:6px;background:#fff;overflow:hidden}
.oitem__row{display:flex;align-items:center;padding:14px 16px}
.oitem__row--top{gap:12px}
.thumb{width:80px;height:80px;object-fit:cover;border:1px solid var(--border);border-radius:4px;background:#f3f4f6;flex-shrink:0}
.meta{flex:1 1 auto;min-width:0}
.name{margin:0 0 6px 0;color:var(--text);font-weight:600;font-size:16px;line-height:1.3}
.sub{margin:2px 0;color:var(--muted);font-size:14px}
.price-right{margin-left:auto;color:var(--red);font-weight:700;font-size:16px;flex-shrink:0}
.divider{height:1px;background:#F5F5F5}

/* row bottom */
.oitem__row--bot{gap:12px;background:#FAFAFA;flex-wrap:wrap}
.status-left{display:flex;align-items:center;gap:10px;flex:1;min-width:200px}
.ship{display:inline-flex;align-items:center;gap:6px;color:var(--blue);font-weight:600;font-size:14px}
.ship-status{font-weight:600;font-size:14px}
.ss--ORDERED{color:#8B5CF6}
.ss--PENDING{color:#D97706}
.ss--SHIPPING{color:#2563EB}
.ss--COMPLETED{color:#10B981}
.dot{width:1px;height:14px;background:#D0D0D0;display:inline-block}
.status-text{font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:.3px}
.st--ORDERED{color:#8B5CF6}
.st--PENDING{color:#D97706}
.st--SHIPPING{color:#2563EB}
.st--COMPLETED{color:#10B981}
.st--CANCELLED{color:var(--red)}
.st--RETURNED{color:var(--red)}

.actions{display:flex;gap:8px;flex-wrap:wrap}
.btn-action{height:36px;padding:0 16px;border-radius:6px;border:1px solid;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s}
.btn-action.disabled{opacity:.5;cursor:not-allowed}
.btn-rate{border-color:var(--red);background:var(--red);color:#fff}
.btn-rate:hover:not(.disabled){filter:brightness(.95)}
.btn-contact{border-color:#D1D5DB;background:#fff;color:#374151}
.btn-contact:hover:not(.disabled){background:#F3F4F6}
.btn-cancel{border-color:#D1D5DB;background:#fff;color:#6B7280}
.btn-cancel:hover:not(.disabled){background:#F3F4F6}
.btn-buy-again{border-color:var(--red);background:#fff;color:var(--red)}
.btn-buy-again:hover:not(.disabled){background:#FEF2F2}

.total{margin-left:auto;display:flex;align-items:center;gap:8px;flex-shrink:0}
.total__label{color:var(--muted);font-size:14px}
.total__val{color:var(--red);font-size:20px;font-weight:800}

/* ✅ Popup overlay */
.popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}
.popup-card{background:#fff;border-radius:12px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 25px -5px rgba(0,0,0,.1)}

/* ✅ Rating popup */
.popup-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)}
.popup-header h3{margin:0;font-size:18px;font-weight:700}
.popup-close{background:transparent;border:0;font-size:32px;line-height:1;cursor:pointer;color:var(--muted);padding:0;width:32px;height:32px}
.popup-close:hover{color:var(--text)}

.popup-body{padding:20px}
.rating-product{display:flex;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.rating-thumb{width:60px;height:60px;object-fit:cover;border:1px solid var(--border);border-radius:4px}
.rating-name{margin:0 0 4px 0;font-size:16px;font-weight:600}
.rating-variant{margin:0;font-size:14px;color:var(--muted)}
.rating-qty{margin:4px 0 0 0;font-size:14px;color:var(--muted)}

.rating-section{margin-bottom:16px}
.rating-label{display:block;margin-bottom:8px;font-weight:600;font-size:14px}
.stars{display:flex;gap:4px}
.star{background:transparent;border:0;font-size:32px;color:#D1D5DB;cursor:pointer;padding:0;transition:color .2s}
.star.active{color:#FFA500}
.star:hover{color:#FFA500}

.rating-textarea{width:100%;padding:12px;border:1px solid var(--border);border-radius:6px;font-size:14px;font-family:inherit;resize:vertical}
.rating-textarea:focus{outline:none;border-color:var(--blue)}

.rating-upload{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border:1px dashed var(--border);border-radius:6px;cursor:pointer;font-size:14px;color:var(--blue);transition:all .2s}
.rating-upload:hover{border-color:var(--blue);background:#F0F9FF}
.image-previews{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.image-preview{position:relative;width:80px;height:80px;border:1px solid var(--border);border-radius:4px;overflow:hidden}
.image-preview img{width:100%;height:100%;object-fit:cover}
.remove-img{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:0;cursor:pointer;font-size:16px;line-height:1}
.remove-img:hover{background:rgba(0,0,0,.8)}

.popup-footer{display:flex;gap:12px;padding:16px 20px;border-top:1px solid var(--border)}
.btn-popup{flex:1;height:44px;border-radius:6px;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s}
.btn-back{border:1px solid #D1D5DB;background:#fff;color:#374151}
.btn-back:hover{background:#F3F4F6}
.btn-submit{border:1px solid var(--red);background:var(--red);color:#fff}
.btn-submit:hover{filter:brightness(.95)}

/* ✅ Cancel popup */
.popup-cancel{max-width:420px}
.cancel-title{margin:0;padding:20px;font-size:18px;font-weight:700;border-bottom:1px solid var(--border)}
.cancel-reasons{padding:16px 20px}
.cancel-reason{display:flex;align-items:center;gap:10px;padding:12px 0;cursor:pointer;font-size:15px}
.cancel-reason input[type="radio"]{width:18px;height:18px;cursor:pointer}
.cancel-reason:hover{color:var(--red)}
.cancel-footer{display:flex;gap:12px;padding:16px 20px;border-top:1px solid var(--border)}

@media (max-width:900px){
  .grid{grid-template-columns:1fr}
  .orders-tabs__nav{gap:8px;padding:0 12px}
  .orders-tab{padding:0 12px;font-size:15px}
  .name{font-size:15px}
  .total__val{font-size:18px}
  .oitem__row--bot{flex-direction:column;align-items:stretch}
  .status-left{min-width:auto}
  .actions{width:100%;justify-content:space-between}
  .total{margin-left:0;justify-content:space-between;width:100%;padding-top:8px;border-top:1px solid var(--border)}
}
</style>
