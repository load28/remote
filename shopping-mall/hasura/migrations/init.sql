-- Shopping Mall Database Schema

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url TEXT,
    category_id INTEGER REFERENCES categories(id),
    stock INTEGER DEFAULT 0,
    rating DECIMAL(2, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_sale BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Wishlist table
CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Insert sample categories
INSERT INTO categories (name, slug, image_url) VALUES
    ('Electronics', 'electronics', 'https://picsum.photos/seed/electronics/400/300'),
    ('Fashion', 'fashion', 'https://picsum.photos/seed/fashion/400/300'),
    ('Home & Living', 'home-living', 'https://picsum.photos/seed/home/400/300'),
    ('Beauty', 'beauty', 'https://picsum.photos/seed/beauty/400/300'),
    ('Sports', 'sports', 'https://picsum.photos/seed/sports/400/300'),
    ('Books', 'books', 'https://picsum.photos/seed/books/400/300');

-- Insert sample products
INSERT INTO products (name, description, price, original_price, image_url, category_id, stock, rating, review_count, is_featured, is_sale) VALUES
    ('Wireless Bluetooth Earbuds', 'High-quality wireless earbuds with noise cancellation', 79.99, 99.99, 'https://picsum.photos/seed/earbuds/400/400', 1, 150, 4.5, 234, TRUE, TRUE),
    ('Smart Watch Pro', 'Advanced smartwatch with health monitoring', 199.99, NULL, 'https://picsum.photos/seed/watch/400/400', 1, 80, 4.7, 189, TRUE, FALSE),
    ('Portable Charger 20000mAh', 'Fast charging power bank', 39.99, 49.99, 'https://picsum.photos/seed/charger/400/400', 1, 200, 4.3, 456, FALSE, TRUE),
    ('USB-C Hub Adapter', 'Multi-port USB-C hub for laptops', 29.99, NULL, 'https://picsum.photos/seed/hub/400/400', 1, 120, 4.4, 178, FALSE, FALSE),

    ('Premium Cotton T-Shirt', 'Comfortable everyday cotton t-shirt', 24.99, NULL, 'https://picsum.photos/seed/tshirt/400/400', 2, 300, 4.2, 567, TRUE, FALSE),
    ('Denim Jacket Classic', 'Classic style denim jacket', 89.99, 119.99, 'https://picsum.photos/seed/jacket/400/400', 2, 75, 4.6, 123, TRUE, TRUE),
    ('Summer Floral Dress', 'Light and comfortable summer dress', 49.99, NULL, 'https://picsum.photos/seed/dress/400/400', 2, 100, 4.4, 89, FALSE, FALSE),
    ('Running Sneakers', 'Lightweight running shoes', 79.99, 99.99, 'https://picsum.photos/seed/sneakers/400/400', 2, 150, 4.5, 234, TRUE, TRUE),

    ('Modern Table Lamp', 'Minimalist LED table lamp', 45.99, NULL, 'https://picsum.photos/seed/lamp/400/400', 3, 60, 4.3, 78, FALSE, FALSE),
    ('Throw Pillow Set', 'Set of 4 decorative throw pillows', 34.99, 44.99, 'https://picsum.photos/seed/pillow/400/400', 3, 90, 4.1, 145, FALSE, TRUE),
    ('Wall Art Canvas', 'Modern abstract wall art', 59.99, NULL, 'https://picsum.photos/seed/art/400/400', 3, 40, 4.7, 67, TRUE, FALSE),
    ('Ceramic Vase Set', 'Handcrafted ceramic vases', 39.99, NULL, 'https://picsum.photos/seed/vase/400/400', 3, 55, 4.4, 89, FALSE, FALSE),

    ('Vitamin C Serum', 'Brightening vitamin C face serum', 28.99, NULL, 'https://picsum.photos/seed/serum/400/400', 4, 200, 4.6, 345, TRUE, FALSE),
    ('Moisturizing Cream', 'Deep hydrating face cream', 32.99, 39.99, 'https://picsum.photos/seed/cream/400/400', 4, 180, 4.5, 267, FALSE, TRUE),
    ('Lipstick Collection', 'Set of 6 matte lipsticks', 24.99, NULL, 'https://picsum.photos/seed/lipstick/400/400', 4, 150, 4.3, 198, FALSE, FALSE),
    ('Perfume Eau de Toilette', 'Fresh floral fragrance', 54.99, 69.99, 'https://picsum.photos/seed/perfume/400/400', 4, 70, 4.8, 156, TRUE, TRUE),

    ('Yoga Mat Premium', 'Non-slip yoga mat', 29.99, NULL, 'https://picsum.photos/seed/yoga/400/400', 5, 120, 4.4, 234, FALSE, FALSE),
    ('Resistance Bands Set', 'Set of 5 resistance bands', 19.99, 24.99, 'https://picsum.photos/seed/bands/400/400', 5, 200, 4.2, 178, FALSE, TRUE),
    ('Water Bottle Insulated', 'Stainless steel water bottle', 24.99, NULL, 'https://picsum.photos/seed/bottle/400/400', 5, 180, 4.5, 289, TRUE, FALSE),
    ('Dumbbell Set 10kg', 'Adjustable dumbbell set', 49.99, 59.99, 'https://picsum.photos/seed/dumbbell/400/400', 5, 60, 4.6, 123, TRUE, TRUE);

-- Insert sample user
INSERT INTO users (email, name, phone, address) VALUES
    ('demo@example.com', 'Demo User', '010-1234-5678', 'Seoul, South Korea');

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_sale ON products(is_sale);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
