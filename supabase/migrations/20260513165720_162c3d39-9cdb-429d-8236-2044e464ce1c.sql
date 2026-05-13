
-- Fix orders update privilege escalation
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'seller'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'seller'::app_role)
);

-- Fix order_items orphan insert
DROP POLICY IF EXISTS "Public can create order_items" ON public.order_items;
CREATE POLICY "Public can create order_items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  quantity >= 1
  AND quantity <= 100
  AND length(btrim(product_id)) > 0
  AND length(btrim(product_name_snapshot)) > 0
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.status = 'new'
      AND o.created_at > now() - interval '5 minutes'
  )
);
