-- Limpar dados antigos
DELETE FROM public.prices WHERE id != 'price_1T9alEKdM6Yexsz15kuKCXnu';
DELETE FROM public.products WHERE id != 'prod_U7qSOwYRsDqVMj';

-- Insert your Stripe product
INSERT INTO public.products (id, active, name, description)
VALUES ('prod_U7qSOwYRsDqVMj', true, 'Mística Premium', 'Acesso completo a todos os recursos')
ON CONFLICT (id) DO NOTHING;

-- Insert your Stripe price
INSERT INTO public.prices (id, product_id, active, currency, type, unit_amount, interval)
VALUES ('price_1T9alEKdM6Yexsz15kuKCXnu', 'prod_U7qSOwYRsDqVMj', true, 'brl', 'recurring', 990, 'month')
ON CONFLICT (id) DO NOTHING;
