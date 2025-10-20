import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { CartSheet } from './CartSheet';

interface FloatingActionMenuProps {
  restaurantId: string;
  restaurantWhatsApp?: string | null;
}

export function FloatingActionMenu({ restaurantId, restaurantWhatsApp }: FloatingActionMenuProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();

  const whatsappUrl = restaurantWhatsApp ? `https://wa.me/${restaurantWhatsApp.replace(/\D/g, '')}` : '#';

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg custom-primary-bg z-20">
            <Plus className="h-8 w-8" />
            {cartCount > 0 && (
              <Badge variant="destructive" className="absolute top-0 right-0">
                {cartCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end" side="top">
          <div className="flex flex-col gap-2">
            {restaurantWhatsApp && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="ghost" className="w-full justify-start">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Fale Conosco
                </Button>
              </a>
            )}
            <Button variant="ghost" className="w-full justify-start" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Carrinho
              {cartCount > 0 && <Badge className="ml-2">{cartCount}</Badge>}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <CartSheet 
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
        restaurantId={restaurantId}
        restaurantWhatsApp={restaurantWhatsApp}
      />
    </>
  );
}