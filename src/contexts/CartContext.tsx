import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
};

type CartItem = MenuItem & {
  quantity: number;
};

type Coupon = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
};

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
  applyCoupon: (code: string, restaurantId: string) => Promise<void>;
  removeCoupon: () => void;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  finalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const addToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
    showSuccess(`${item.name} adicionado ao carrinho!`);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((i) => i.id !== itemId);
      }
      return prevItems.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      );
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || totalPrice === 0) return 0;
    if (appliedCoupon.discount_type === 'fixed') {
      return Math.min(appliedCoupon.discount_value, totalPrice);
    }
    if (appliedCoupon.discount_type === 'percentage') {
      return (totalPrice * appliedCoupon.discount_value) / 100;
    }
    return 0;
  }, [appliedCoupon, totalPrice]);

  const finalPrice = useMemo(() => {
    return totalPrice - discountAmount;
  }, [totalPrice, discountAmount]);

  const applyCoupon = async (code: string, restaurantId: string) => {
    const upperCaseCode = code.toUpperCase().trim();
    const { data, error } = await supabase
      .from('coupons')
      .select('code, discount_type, discount_value')
      .eq('user_id', restaurantId)
      .eq('code', upperCaseCode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      showError("Cupom inválido ou expirado.");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(data as Coupon);
    showSuccess(`Cupom "${data.code}" aplicado com sucesso!`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    totalPrice,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    discountAmount,
    finalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};