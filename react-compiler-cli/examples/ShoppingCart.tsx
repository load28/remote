import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * 복잡한 쇼핑카트 컴포넌트.
 *
 * 안티패턴:
 * - 과도한 상태 (파생 가능한 값도 useState로 관리)
 * - 불필요한 mutation (let, 중간 변수 남발)
 * - 비순수 계산 로직 (부수효과가 섞인 함수)
 * - 과도한 useEffect (파생 상태를 effect로 동기화)
 * - 불필요한 useCallback/useMemo (컴파일러가 처리할 수 있는 것)
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
  // --- 과도한 상태 ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const lastAddedRef = useRef<number | null>(null);

  // --- 파생 상태를 useEffect로 동기화 (안티패턴) ---
  useEffect(() => {
    let sum = 0;
    for (let i = 0; i < cartItems.length; i++) {
      sum = sum + cartItems[i].product.price * cartItems[i].quantity;
    }
    setSubtotal(sum);
  }, [cartItems]);

  useEffect(() => {
    let discountAmount = 0;
    if (selectedCoupon) {
      const coupon = coupons.find((c) => c.code === selectedCoupon);
      if (coupon && subtotal >= coupon.minAmount) {
        if (coupon.type === 'percent') {
          discountAmount = subtotal * (coupon.value / 100);
        } else {
          discountAmount = coupon.value;
        }
      }
    }
    setDiscount(discountAmount);
  }, [selectedCoupon, subtotal, coupons]);

  useEffect(() => {
    const taxableAmount = subtotal - discount;
    let taxAmount = 0;
    if (taxableAmount > 0) {
      taxAmount = taxableAmount * taxRate;
    }
    setTax(taxAmount);
  }, [subtotal, discount, taxRate]);

  useEffect(() => {
    let shippingCost = 5000;
    if (subtotal >= freeShippingThreshold) {
      shippingCost = 0;
    }
    setShipping(shippingCost);
  }, [subtotal, freeShippingThreshold]);

  useEffect(() => {
    setTotal(subtotal - discount + tax + shipping);
  }, [subtotal, discount, tax, shipping]);

  // --- 불필요한 mutation과 비순수 로직 ---
  const addToCart = useCallback(
    (product: Product) => {
      let found = false;
      let newItems: CartItem[] = [];
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].product.id === product.id) {
          newItems.push({
            ...cartItems[i],
            quantity: cartItems[i].quantity + 1,
          });
          found = true;
        } else {
          newItems.push(cartItems[i]);
        }
      }
      if (!found) {
        newItems.push({ product, quantity: 1 });
      }
      lastAddedRef.current = product.id;
      setCartItems(newItems);
      setIsCartOpen(true);
    },
    [cartItems],
  );

  const removeFromCart = useCallback(
    (productId: number) => {
      let newItems: CartItem[] = [];
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].product.id !== productId) {
          newItems.push(cartItems[i]);
        }
      }
      setCartItems(newItems);
    },
    [cartItems],
  );

  const updateQuantity = useCallback(
    (productId: number, delta: number) => {
      let newItems: CartItem[] = [];
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].product.id === productId) {
          const newQty = cartItems[i].quantity + delta;
          if (newQty > 0) {
            newItems.push({ ...cartItems[i], quantity: newQty });
          }
        } else {
          newItems.push(cartItems[i]);
        }
      }
      setCartItems(newItems);
    },
    [cartItems],
  );

  // --- 불필요한 중간 변수 + 명령형 필터/정렬 ---
  const getFilteredProducts = useCallback(() => {
    let filtered: Product[] = [];
    for (let i = 0; i < products.length; i++) {
      let match = true;
      if (filterCategory !== 'all' && products[i].category !== filterCategory) {
        match = false;
      }
      if (searchQuery !== '') {
        const lower = products[i].name.toLowerCase();
        if (lower.indexOf(searchQuery.toLowerCase()) === -1) {
          match = false;
        }
      }
      if (match) {
        filtered.push(products[i]);
      }
    }

    // 명령형 정렬
    let sorted = [...filtered];
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        let shouldSwap = false;
        if (sortBy === 'name') {
          shouldSwap = sorted[i].name > sorted[j].name;
        } else {
          shouldSwap = sorted[i].price > sorted[j].price;
        }
        if (shouldSwap) {
          const temp = sorted[i];
          sorted[i] = sorted[j];
          sorted[j] = temp;
        }
      }
    }
    return sorted;
  }, [products, filterCategory, searchQuery, sortBy]);

  const filteredProducts = useMemo(() => getFilteredProducts(), [getFilteredProducts]);

  // --- 카테고리 추출도 명령형 ---
  const categories = useMemo(() => {
    let cats: string[] = ['all'];
    for (let i = 0; i < products.length; i++) {
      let exists = false;
      for (let j = 0; j < cats.length; j++) {
        if (cats[j] === products[i].category) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        cats.push(products[i].category);
      }
    }
    return cats;
  }, [products]);

  // --- 카트 아이템 수 계산도 명령형 ---
  const cartItemCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < cartItems.length; i++) {
      count = count + cartItems[i].quantity;
    }
    return count;
  }, [cartItems]);

  // --- 가격 포맷도 비순수 (외부 로케일 참조) ---
  const formatPrice = useCallback((price: number) => {
    let formatted = '';
    const rounded = Math.round(price);
    const str = String(rounded);
    let count = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      formatted = str[i] + formatted;
      count++;
      if (count % 3 === 0 && i > 0) {
        formatted = ',' + formatted;
      }
    }
    return formatted + '원';
  }, []);

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
            <button onClick={() => addToCart(product)}>Add</button>
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
                    <button onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                    <button onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                    <button onClick={() => removeFromCart(item.product.id)}>Remove</button>
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
