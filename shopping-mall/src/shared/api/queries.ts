import { gql } from 'graphql-request';

// Category queries
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories(order_by: { id: asc }) {
      id
      name
      slug
      image_url
    }
  }
`;

// Product queries
export const GET_PRODUCTS = gql`
  query GetProducts($limit: Int, $offset: Int, $where: products_bool_exp) {
    products(limit: $limit, offset: $offset, where: $where, order_by: { created_at: desc }) {
      id
      name
      description
      price
      original_price
      image_url
      stock
      rating
      review_count
      is_featured
      is_sale
      category {
        id
        name
        slug
      }
    }
    products_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_FEATURED_PRODUCTS = gql`
  query GetFeaturedProducts {
    products(where: { is_featured: { _eq: true } }, limit: 8) {
      id
      name
      price
      original_price
      image_url
      rating
      review_count
      is_sale
    }
  }
`;

export const GET_SALE_PRODUCTS = gql`
  query GetSaleProducts {
    products(where: { is_sale: { _eq: true } }, limit: 8) {
      id
      name
      price
      original_price
      image_url
      rating
      review_count
    }
  }
`;

export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: Int!) {
    products_by_pk(id: $id) {
      id
      name
      description
      price
      original_price
      image_url
      stock
      rating
      review_count
      is_featured
      is_sale
      category {
        id
        name
        slug
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($categorySlug: String!, $limit: Int, $offset: Int) {
    products(
      where: { category: { slug: { _eq: $categorySlug } } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      name
      price
      original_price
      image_url
      rating
      review_count
      is_sale
    }
    products_aggregate(where: { category: { slug: { _eq: $categorySlug } } }) {
      aggregate {
        count
      }
    }
  }
`;

// Cart queries
export const GET_CART_ITEMS = gql`
  query GetCartItems($userId: Int!) {
    cart_items(where: { user_id: { _eq: $userId } }) {
      id
      quantity
      product {
        id
        name
        price
        image_url
        stock
      }
    }
  }
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($userId: Int!, $productId: Int!, $quantity: Int!) {
    insert_cart_items_one(
      object: { user_id: $userId, product_id: $productId, quantity: $quantity }
      on_conflict: { constraint: cart_items_user_id_product_id_key, update_columns: [quantity] }
    ) {
      id
      quantity
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($id: Int!, $quantity: Int!) {
    update_cart_items_by_pk(pk_columns: { id: $id }, _set: { quantity: $quantity }) {
      id
      quantity
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($id: Int!) {
    delete_cart_items_by_pk(id: $id) {
      id
    }
  }
`;

export const CLEAR_CART = gql`
  mutation ClearCart($userId: Int!) {
    delete_cart_items(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

// Search query
export const SEARCH_PRODUCTS = gql`
  query SearchProducts($search: String!) {
    products(where: { name: { _ilike: $search } }, limit: 20) {
      id
      name
      price
      original_price
      image_url
      rating
      is_sale
    }
  }
`;
