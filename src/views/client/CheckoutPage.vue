<!-- src/views/client/CheckoutPage.vue -->
<template>
  <div class="checkout">
    <ClientHeader />

    <main class="container">
      <!-- ===== ĐỊA CHỈ GIAO HÀNG ===== -->
      <section class="card address">
        <div class="address__head">
          <div class="head-left">
            <!-- ICON -->
            <span class="addr-icon" aria-hidden="true">
              <svg viewBox="0 0 30 30" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#EAF2FF"/>
                <path d="M12 6.25c2.071 0 3.75 1.679 3.75 3.75 0 2.566-2.485 5.22-3.313 6.052a.62.62 0 0 1-.874 0C10.735 15.22 8.25 12.566 8.25 10c0-2.071 1.679-3.75 3.75-3.75Z" stroke="#2563EB" stroke-width="1.6" fill="#fff"/>
                <circle cx="12" cy="10" r="1.5" fill="#2563EB"/>
              </svg>
            </span>
            <h3>Địa chỉ giao hàng</h3>
          </div>
        </div>

        <!-- Danh sách địa chỉ -->
        <div v-if="addrLoading" class="state">Đang tải địa chỉ…</div>
        <div v-else-if="addrError" class="state state--error">{{ addrError }}</div>
        <div v-else>
          <div v-if="addresses.length" class="address__list">
            <label v-for="a in addresses" :key="a.id" class="addr-item">
              <input
                type="radio"
                name="shipping_addr"
                :value="a.id"
                v-model="selectedAddressId"
              />
              <div class="addr-info">
                <div class="addr-name">{{ a.fullName }} • {{ a.phone }}</div>
                <div class="addr-line">
                  {{ a.addressLine }}, {{ a.ward }}, {{ a.district }}, {{ a.province }}
                </div>
                <div v-if="a.isDefault" class="addr-badge">Mặc định</div>
              </div>
            </label>
          </div>

          <!-- Link “+ Thêm địa chỉ giao hàng” đặt dưới phần địa chỉ -->
          <button class="add-link" type="button" @click="openAddressListPopup">
            <span class="plus">+</span> Thêm địa chỉ giao hàng
          </button>
        </div>
      </section>

      <!-- ===== SẢN PHẨM / ĐẶT HÀNG ===== -->
      <section class="card order">
        <div class="order__head">
          <h3>Sản phẩm</h3>
          <div class="cols-head">
            <span>Đơn giá</span>
            <span>Số lượng</span>
            <span>Thành tiền</span>
          </div>
        </div>

        <div v-if="cartLoading" class="state">Đang tải giỏ hàng…</div>
        <div v-else-if="cartError" class="state state--error">{{ cartError }}</div>
        <div v-else>
          <div v-for="it in items" :key="it.key" class="row">
            <div class="prod">
              <img :src="it.image || '/placeholder.png'" alt="" @error="e => e.target.src = '/placeholder.png'">
              <div>
                <div class="prod__name">{{ it.name }}</div>
                <div class="prod__meta" v-if="it.color || it.size">
                  <span v-if="it.color">Màu: {{ it.color }}</span>
                  <span v-if="it.size"> • Size: {{ it.size }}</span>
                </div>
              </div>
            </div>

            <div class="col price">{{ toVND(it.price) }}</div>
            <div class="col qty">{{ it.quantity }}</div>
            <div class="col line">{{ toVND(it.price * it.quantity) }}</div>
          </div>

          <div class="separator"></div>

          <div class="note-and-payment">
            <div class="note">
              <label for="buyerNote">Lời nhắn:</label>
              <input
                id="buyerNote"
                v-model.trim="note"
                type="text"
                placeholder="Lưu ý cho người bán…"
              >
            </div>

            <div class="payment">
              <div class="pay-title">Phương thức thanh toán</div>
              <label class="radio">
                <input type="radio" value="COD" v-model="paymentMethod">
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>
            </div>
          </div>

          <div class="totals">
            <div class="rowx">
              <span>Tổng tiền hàng:</span>
              <b>{{ toVND(subtotal) }}</b>
            </div>
            <div class="rowx total">
              <span>Tổng thanh toán:</span>
              <b class="total__money">{{ toVND(total) }}</b>
            </div>
          </div>

          <p class="terms">
            Nhấn “Đặt hàng” đồng nghĩa với việc bạn đồng ý tuân theo
            <a class="term">Điều khoản Fashion</a>
          </p>

          <div class="place">
            <button
              class="btn primary"
              :disabled="!canPlace || placing"
              @click="placeOrder"
            >
              {{ placing ? 'Đang đặt hàng…' : 'Đặt hàng' }}
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- POPUP ĐỊA CHỈ -->
    <AddressPopup
      v-if="showAddressPopup"
      @close="showAddressPopup = false"
      @select="onAddressSelected"
      @updated="reloadAddressesAfterPopup"
    />
    <!-- POPUP DANH SÁCH ĐỊA CHỈ -->
    <AddressListPopup
      v-if="showAddressListPopup"
      :addresses="addresses"
      :model-value="selectedAddressId"
      @close="closeAddressListPopup"
      @confirm="id => { selectedAddressId = id; closeAddressListPopup() }"
      @add-new="() => { closeAddressListPopup(); showAddressPopup = true }"
    />

    <ClientFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import ClientHeader from '../../components/client/ClientHeaderLogged.vue'
import ClientFooter from '../../components/client/ClientFooter.vue'
import AddressListPopup from '../../components/client/AddressListPopup.vue'
import AddressPopup from '../../components/client/AddressPopup.vue'

import { getMyAddresses } from '../../services/addressService'
import { useCart } from '../../services/cartService'
import { createOrder } from '../../services/orderService'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const { cartState, fetchCart } = useCart()

/* Địa chỉ */
const addresses = ref([])
const selectedAddressId = ref(null)
const addrLoading = ref(true)
const addrError = ref('')

/* Popup */
const showAddressPopup = ref(false)
const showAddressListPopup = ref(false)

function openAddressListPopup() {
  showAddressListPopup.value = true
}
function closeAddressListPopup() {
  showAddressListPopup.value = false
}
function openAddressPopup () {
  showAddressPopup.value = true
}
async function onAddressSelected (addr) {
  // Nếu popup trả id thì chọn luôn; sau đó refresh để đồng bộ danh sách
  if (addr?.id) selectedAddressId.value = addr.id
  showAddressPopup.value = false
  await loadAddresses()
}
async function reloadAddressesAfterPopup () {
  await loadAddresses()
}

/* Sản phẩm */
const items = ref([])
const cartLoading = ref(true)
const cartError = ref('')

/* Form */
const note = ref('')
const paymentMethod = ref('COD')
const placing = ref(false)

/* Nguồn điều hướng (nếu cần chọn từ giỏ) */
const source = computed(() => String(route.query.source || 'cart'))
const selectedIdsFromQuery = computed(() =>
  String(route.query.selected || '')
    .split(',')
    .map(s => Number(s))
    .filter(n => Number.isFinite(n) && n > 0)
)

onMounted(async () => {
  await Promise.all([loadAddresses(), loadItems()])
})

async function loadAddresses () {
  addrLoading.value = true
  addrError.value = ''
  try {
    const res = await getMyAddresses()
    const list = Array.isArray(res?.data) ? res.data : (res || [])
    addresses.value = list.map(a => ({
      id: a.id ?? a.addressId,
      fullName: a.fullName ?? a.name ?? '',
      phone: a.phone ?? a.phoneNumber ?? '',
      addressLine: a.addressLine ?? a.street ?? a.line1 ?? '',
      ward: a.ward ?? a.wardName ?? '',
      district: a.district ?? a.districtName ?? '',
      province: a.province ?? a.city ?? a.provinceName ?? '',
      isDefault: !!(a.isDefault ?? a.default)
    }))
    const def = addresses.value.find(x => x.isDefault) || addresses.value[0]
    if (!selectedAddressId.value || !addresses.value.some(a => a.id === selectedAddressId.value)) {
      selectedAddressId.value = def?.id ?? null
    }
  } catch (e) {
    addrError.value = e?.message || 'Không tải được địa chỉ.'
  } finally {
    addrLoading.value = false
  }
}

async function loadItems () {
  cartLoading.value = true
  cartError.value = ''
  try {
    await fetchCart()
    let list = Array.isArray(cartState.items) ? cartState.items : []
    
    // ✅ Lọc sản phẩm dựa trên source
    if (source.value === 'cart' && selectedIdsFromQuery.value.length > 0) {
      // Từ giỏ hàng: chỉ hiển thị các sản phẩm đã chọn
      const set = new Set(selectedIdsFromQuery.value)
      list = list.filter(i => set.has(i.id))
    } else if (source.value === 'buynow' && selectedIdsFromQuery.value.length > 0) {
      // Từ "Mua ngay": chỉ hiển thị sản phẩm vừa thêm
      const set = new Set(selectedIdsFromQuery.value)
      list = list.filter(i => set.has(i.id))
    }
    // Nếu không có filter nào, hiển thị toàn bộ giỏ hàng
    
    items.value = list.map((it, idx) => ({
      key: it.id ?? idx,
      id: it.productId ?? it.id,
      variantId: it.productVariantId ?? it.variantId ?? null,
      name: it.name ?? 'Sản phẩm',
      color: parseVariant(it.variant).color,
      size: parseVariant(it.variant).size,
      image: it.image || it.imageUrl || '',
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1)
    }))
  } catch (e) {
    console.error(e)
    cartError.value = e?.message || 'Không tải được sản phẩm.'
  } finally {
    cartLoading.value = false
  }
}

function parseVariant (v) {
  const raw = String(v || '').split(',').map(s => s.trim()).filter(Boolean)
  return { color: raw[0] || '', size: raw[1] || '' }
}

/* Tổng tiền */
const subtotal = computed(() => items.value.reduce((s, it) => s + it.price * it.quantity, 0))
const shippingFee = computed(() => 0)
const total = computed(() => subtotal.value + shippingFee.value)

/* Điều kiện đặt hàng */
const canPlace = computed(() =>
  auth.isLoggedIn && items.value.length > 0 && !!selectedAddressId.value && !!paymentMethod.value
)

/* Helpers */
function toVND (n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Math.round(n || 0))
}

/* Đặt hàng */
/* Đặt hàng */
async function placeOrder () {
  if (!canPlace.value || placing.value) return
  if (!selectedAddressId.value) {
    alert('Bạn chưa chọn địa chỉ giao hàng'); 
    return
  }
  if (!items.value.length) {
    alert('Giỏ hàng trống'); 
    return
  }

  placing.value = true
  try {
    // dựng items đúng định dạng BE
    const orderItems = items.value.map(i => {
      const x = {
        productId: i.id,                 // id sản phẩm
        quantity: Number(i.quantity),    // số
        price: Number(i.price)           // số
      }
      // nếu có biến thể thì gửi kèm (BE nào dùng variantId / productVariantId)
      if (i.variantId) x.variantId = i.variantId
      // nếu BE của bạn dùng tên khác:
      // if (i.variantId) x.productVariantId = i.variantId
      return x
    })

    const payload = {
      addressId: Number(selectedAddressId.value),
      note: (note.value || '').trim(),
      paymentMethod: paymentMethod.value || 'COD',
      items: orderItems,
      subtotal: Number(subtotal.value),
      discount: 0,
      shippingFee: Number(shippingFee.value || 0),
      total: Number(total.value) // subtotal - discount + shippingFee
    }

    // xem nhanh payload trước khi gửi
    // console.log('ORDER PAYLOAD >>>', payload)

    const res = await createOrder(payload)

    const orderId = res?.orderId ?? res?.data?.orderId ?? res?.data?.id ?? res?.id
    if (orderId) router.push({ path: `/orders/${orderId}` })
    else router.push({ path: '/orders' })
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Đặt hàng thất bại. Vui lòng thử lại!'
    alert(msg)
    console.error('Order error:', e?.response?.data || e)
  } finally {
    placing.value = false
  }
}

</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Khula:wght@400;600;700&display=swap");

/* ... giữ nguyên toàn bộ CSS của bạn ... */
.checkout { 
  background : #f7f7f7; 
  font-family : "Khula", sans-serif; 
}
/* (phần CSS dưới mình giữ nguyên như bạn gửi) */
.container { max-width:980px; margin:20px auto 40px; padding:0 16px }
.card { background:#fff; border:1px solid #e6e8ee; border-radius:10px; box-shadow:0 1px 0 rgba(16,24,40,.02); padding:16px; margin-bottom:16px }
.address__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
.head-left { display:flex; align-items:center; gap:8px }
.addr-icon { display:inline-flex; align-items:center; justify-content:center; width:35px; height:35px }
.address__head h3, .order__head h3 { font-size:16px; font-weight:700; color:#111827 }
.add-link { margin-top:8px; display:inline-flex; align-items:center; gap:6px; background:none; border:none; color:#2563eb; font-weight:400; font-size:15px; cursor:pointer; padding:0 }
.add-link .plus { font-size:18px; line-height:1 }
.address__list { display:grid; gap:10px; margin-top:6px }
.addr-item { display:grid; grid-template-columns:18px 1fr; gap:10px; align-items:start; padding:10px; border:1px solid #eef0f6; border-radius:8px }
.addr-item input { margin-top:3px }
.addr-name { font-weight:700; color:#111827 }
.addr-line { color:#4b5563; margin-top:2px }
.addr-badge { display:inline-block; margin-top:6px; font-size:12px; font-weight:700; background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:999px }
.order__head { display:grid; grid-template-columns:1fr auto; align-items:end; gap:12px }
.cols-head { display:grid; grid-template-columns:140px 100px 120px; gap:12px; color:#6b7280; font-weight:700; text-align:center }
@media (max-width:720px){ .cols-head { display:none } }
.row { display:grid; grid-template-columns:1fr 140px 100px 120px; gap:12px; padding:12px 0; align-items:center; border-top:1px solid #f1f3f8 }
.prod { display:grid; grid-template-columns:64px 1fr; gap:12px; align-items:center }
.prod img { width:64px; height:64px; object-fit:cover; border-radius:8px; border:1px solid #eee }
.prod__name { font-weight:700; color:#111827 }
.prod__meta { color:#6b7280; font-size:13px; margin-top:2px }
.col { color:#111827 }
.col.price, .col.qty, .col.line { text-align:center }
.separator { height:1px; background:#eef0f6; margin:10px 0 14px }
.note-and-payment { display:grid; grid-template-columns:1fr 320px; gap:16px; align-items:start }
@media (max-width:900px){ .note-and-payment { grid-template-columns:1fr } }
.note { display:flex; align-items:center; gap:10px }
.note label { margin-bottom:0; white-space:nowrap; font-weight:700; color:#374151 }
.note input { flex:1; height:38px; border:1px solid #e5e7eb; border-radius:8px; padding:0 12px }
.payment { border:1px solid #eef0f6; border-radius:8px; padding:12px }
.pay-title { font-weight:700; margin-bottom:8px }
.radio { display:grid; grid-template-columns:16px 1fr; gap:10px; align-items:center; margin-top:6px }
.totals { border-top:1px solid #eef0f6; width:100%; margin-top:16px; display:grid; gap:8px; background-color:#FFFDF8 }
.rowx { display:flex; justify-content:flex-end; gap:24px; color:#111827; margin-top:20px }
.rowx b { min-width:160px; text-align:right }
.rowx.total { font-size:18px; font-weight:800 }
.total__money { color:#ef4444 }
.term { color:#2563eb; font-size:13px; margin:14px 0 }
.terms { color:#111827; font-size:13px; margin:14px 0 }
.place { display:flex; justify-content:flex-end }
.btn.primary { background:#ef4444; color:#fff; border:none; border-radius:8px; height:44px; padding:0 22px; font-weight:800; cursor:pointer }
.btn.primary:disabled { opacity:.6; cursor:not-allowed }
.state { text-align:center; padding:10px 0; color:#4b5563 }
.state--error { color:#b91c1c }
</style>
