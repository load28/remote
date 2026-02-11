import { useState } from 'react';

/**
 * 리팩토링된 쇼핑카트 컴포넌트.
 *
 * 원칙:
 * - 최소 상태: 독립적인 사용자 입력만 useState (파생 값은 계산)
 * - 순수 함수: 컴포넌트 외부에 선언, 부수효과 없음
 * - 함수형 배열 처리: for 루프 → filter/map/reduce/sort
 * - useCallback/useMemo 제거: React Compiler가 자동 메모이제이션
 * - useEffect 제거: 파생 상태를 effect로 동기화하지 않음
 */

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minAmount: number;
}

// ─── 순수 함수: 컴포넌트 외부 선언 ───

const calcSubtotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

const calcDiscount = (coupon: Coupon | undefined, subtotal: number): number => {
  if (!coupon || subtotal < coupon.minAmount) return 0;
  return coupon.type === 'percent'
    ? subtotal * (coupon.value / 100)
    : coupon.value;
};

const calcTax = (subtotal: number, discount: number, taxRate: number): number =>
  Math.max(0, (subtotal - discount) * taxRate);

const calcShipping = (subtotal: number, threshold: number): number =>
  subtotal >= threshold ? 0 : 5000;

const formatPrice = (price: number): string =>
  Math.round(price).toLocaleString() + '원';

const uniqueCategories = (products: Product[]): string[] => [
  'all',
  ...new Set(products.map((p) => p.category)),
];

const filterAndSort = (
  products: Product[],
  category: string,
  query: string,
  sortBy: 'name' | 'price',
): Product[] =>
  products
    .filter((p) => category === 'all' || p.category === category)
    .filter((p) => query === '' || p.name.toLowerCase().includes(query.toLowerCase()))
    .toSorted((a, b) =>
      sortBy === 'name' ? a.name.localeCompare(b.name) : a.price - b.price,
    );

const addItem = (items: CartItem[], product: Product): CartItem[] => {
  const existing = items.find((item) => item.product.id === product.id);
  return existing
    ? items.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      )
    : [...items, { product, quantity: 1 }];
};

const removeItem = (items: CartItem[], productId: number): CartItem[] =>
  items.filter((item) => item.product.id !== productId);

const updateQty = (items: CartItem[], productId: number, delta: number): CartItem[] =>
  items
    .map((item) =>
      item.product.id === productId
        ? { ...item, quantity: item.quantity + delta }
        : item,
    )
    .filter((item) => item.quantity > 0);

// ─── 컴포넌트 ───

export function ShoppingCart({
  products,
  coupons,
  taxRate,
  freeShippingThreshold,
}: {
  products: Product[];
  coupons: Coupon[];
  taxRate: number;
  freeShippingThreshold: number;
}) {
  // 최소 상태: 사용자 입력만
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 파생 값: 순수 함수로 직접 계산 (useEffect/useMemo 불필요)
  const subtotal = calcSubtotal(cartItems);
  const coupon = coupons.find((c) => c.code === selectedCoupon);
  const discount = calcDiscount(coupon, subtotal);
  const tax = calcTax(subtotal, discount, taxRate);
  const shipping = calcShipping(subtotal, freeShippingThreshold);
  const total = subtotal - discount + tax + shipping;

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const categories = uniqueCategories(products);
  const filteredProducts = filterAndSort(products, filterCategory, searchQuery, sortBy);

  return (
    <div>
      <header>
        <h1>Shopping Cart</h1>
        <button onClick={() => setIsCartOpen(!isCartOpen)}>
          Cart ({cartItemCount})
        </button>
      </header>

      <div>
        <input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}>
          <option value="name">Name</option>
          <option value="price">Price</option>
        </select>
      </div>

      <ul>
        {filteredProducts.map((product) => (
          <li key={product.id}>
            <span>
              {product.name} - {formatPrice(product.price)}
            </span>
            <button onClick={() => {
              setCartItems((prev) => addItem(prev, product));
              setIsCartOpen(true);
            }}>Add</button>
          </li>
        ))}
      </ul>

      {isCartOpen && (
        <div>
          <h2>Cart</h2>
          {cartItems.length === 0 ? (
            <p>Empty cart</p>
          ) : (
            <>
              <ul>
                {cartItems.map((item) => (
                  <li key={item.product.id}>
                    <span>
                      {item.product.name} x {item.quantity} = {formatPrice(item.product.price * item.quantity)}
                    </span>
                    <button onClick={() => setCartItems((prev) => updateQty(prev, item.product.id, 1))}>+</button>
                    <button onClick={() => setCartItems((prev) => updateQty(prev, item.product.id, -1))}>-</button>
                    <button onClick={() => setCartItems((prev) => removeItem(prev, item.product.id))}>Remove</button>
                  </li>
                ))}
              </ul>

              <div>
                <select
                  value={selectedCoupon || ''}
                  onChange={(e) => setSelectedCoupon(e.target.value || null)}
                >
                  <option value="">No coupon</option>
                  {coupons.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p>Subtotal: {formatPrice(subtotal)}</p>
                {discount > 0 && <p>Discount: -{formatPrice(discount)}</p>}
                <p>Tax: {formatPrice(tax)}</p>
                <p>Shipping: {shipping === 0 ? 'Free' : formatPrice(shipping)}</p>
                <hr />
                <p>
                  <strong>Total: {formatPrice(total)}</strong>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
