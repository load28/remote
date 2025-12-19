export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  stock: number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_sale: boolean;
  category?: Category;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: Pick<Product, 'id' | 'name' | 'price' | 'image_url' | 'stock'>;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
}
