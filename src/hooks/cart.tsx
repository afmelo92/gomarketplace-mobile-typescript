import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import api from 'src/services/api';
import { ProductSinglePrice } from 'src/pages/Cart/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const prods = await AsyncStorage.getItem('@GoMarketplace:product');

      if (prods) {
        setProducts(JSON.parse(prods));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(prod => prod.id === id);

      if (productIndex >= 0) {
        const addProducts = [...products];
        addProducts[productIndex].quantity += 1;

        setProducts(addProducts);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const filteredProducts = products.filter(prod => prod.id !== id);
      const productIndex = products.findIndex(prod => prod.id === id);

      if (productIndex >= 0) {
        if (products[productIndex].quantity <= 1) {
          setProducts(filteredProducts);
        } else {
          const newProducts = [...products];
          newProducts[productIndex].quantity -= 1;

          setProducts(newProducts);
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:product',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const { id } = product;
      const productIndex = products.findIndex(prod => prod.id === id);

      if (productIndex < 0) {
        setProducts(prods => [...prods, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketplace:product',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
