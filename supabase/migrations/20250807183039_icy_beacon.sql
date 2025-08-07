/*
  # Integração com Tabelas Padrão do Sistema

  1. Novas Tabelas Padrão
    - Integração com `products` e `products_variations` existentes
    - Adaptação das tabelas ERP para usar as tabelas padrão
    - Manutenção da compatibilidade com funcionalidades existentes

  2. Mudanças Estruturais
    - Criação de views para compatibilidade
    - Atualização de relacionamentos
    - Migração de dados existentes

  3. Segurança
    - Manutenção das políticas RLS
    - Atualização de triggers e funções
*/

-- Criar tabelas padrão se não existirem (assumindo que já existem)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  category text NOT NULL,
  unit text NOT NULL,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  cost_price numeric(12,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, code)
);

CREATE TABLE IF NOT EXISTS products_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  cost_price numeric(12,2) DEFAULT 0,
  stock_quantity numeric(12,3) DEFAULT 0,
  minimum_stock numeric(12,3) DEFAULT 0,
  attributes jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, code)
);

-- Habilitar RLS nas tabelas padrão se não estiver habilitado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_variations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para products
DROP POLICY IF EXISTS "Users can manage own products" ON products;
CREATE POLICY "Users can manage own products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para products_variations
DROP POLICY IF EXISTS "Users can manage own product variations" ON products_variations;
CREATE POLICY "Users can manage own product variations"
  ON products_variations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p 
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p 
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  );

-- Adicionar campos necessários para integração ERP nas tabelas padrão
ALTER TABLE products ADD COLUMN IF NOT EXISTS allocated_fixed_cost numeric(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS production_time integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_loss_percentage numeric(5,2) DEFAULT 0;

-- Atualizar tabela erp_bom para referenciar products ao invés de erp_products
ALTER TABLE erp_bom DROP CONSTRAINT IF EXISTS erp_bom_product_id_fkey;
ALTER TABLE erp_bom ADD CONSTRAINT erp_bom_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Atualizar tabela erp_production_orders para referenciar products
ALTER TABLE erp_production_orders DROP CONSTRAINT IF EXISTS erp_production_orders_product_id_fkey;
ALTER TABLE erp_production_orders ADD CONSTRAINT erp_production_orders_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Atualizar tabela erp_cost_calculations para referenciar products
ALTER TABLE erp_cost_calculations DROP CONSTRAINT IF EXISTS erp_cost_calculations_product_id_fkey;
ALTER TABLE erp_cost_calculations ADD CONSTRAINT erp_cost_calculations_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Criar view de compatibilidade para manter funcionalidade existente
CREATE OR REPLACE VIEW erp_products_view AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.code,
  p.unit,
  p.category,
  p.sale_price,
  p.allocated_fixed_cost,
  p.production_time,
  p.average_loss_percentage,
  p.created_at,
  p.updated_at,
  p.status
FROM products p
WHERE p.status = 'active';

-- Função para migrar dados existentes de erp_products para products
CREATE OR REPLACE FUNCTION migrate_erp_products_to_standard()
RETURNS void AS $$
BEGIN
  -- Inserir produtos do ERP na tabela padrão se não existirem
  INSERT INTO products (
    id, user_id, name, code, unit, category, sale_price, 
    allocated_fixed_cost, production_time, average_loss_percentage,
    created_at, updated_at
  )
  SELECT 
    ep.id, ep.user_id, ep.name, ep.code, ep.unit, ep.category, ep.sale_price,
    ep.allocated_fixed_cost, ep.production_time, ep.average_loss_percentage,
    ep.created_at, ep.updated_at
  FROM erp_products ep
  WHERE NOT EXISTS (
    SELECT 1 FROM products p WHERE p.id = ep.id
  );
  
  -- Log da migração
  RAISE NOTICE 'Migração de produtos ERP para tabela padrão concluída';
END;
$$ LANGUAGE plpgsql;

-- Executar migração
SELECT migrate_erp_products_to_standard();

-- Atualizar função de cálculo de custos para usar tabela padrão
CREATE OR REPLACE FUNCTION calculate_product_costs(product_uuid uuid)
RETURNS TABLE(
  raw_materials_cost numeric,
  labor_cost numeric,
  indirect_costs numeric,
  loss_cost numeric,
  total_production_cost numeric,
  total_unit_cost numeric,
  profit_margin numeric,
  profit_margin_percentage numeric,
  contribution_margin numeric,
  break_even_point numeric
) AS $$
DECLARE
  product_record products%ROWTYPE;
  bom_record erp_bom%ROWTYPE;
  raw_cost numeric := 0;
  lab_cost numeric := 0;
  ind_cost numeric := 0;
  loss_cost_calc numeric := 0;
  total_prod_cost numeric := 0;
  total_unit_cost_calc numeric := 0;
  profit_margin_calc numeric := 0;
  profit_margin_pct numeric := 0;
  contribution_margin_calc numeric := 0;
  break_even_calc numeric := 0;
BEGIN
  -- Buscar produto na tabela padrão
  SELECT * INTO product_record FROM products WHERE id = product_uuid;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Buscar BOM
  SELECT * INTO bom_record FROM erp_bom WHERE product_id = product_uuid;
  
  IF FOUND THEN
    -- Calcular custo de matérias-primas
    SELECT COALESCE(SUM(bi.waste_adjusted_quantity * rm.unit_cost), 0)
    INTO raw_cost
    FROM erp_bom_items bi
    JOIN erp_raw_materials rm ON rm.id = bi.raw_material_id
    WHERE bi.bom_id = bom_record.id;
    
    -- Calcular custo de mão de obra
    SELECT COALESCE(SUM((ps.time_minutes / 60.0) * ps.labor_cost_per_hour), 0)
    INTO lab_cost
    FROM erp_production_steps ps
    WHERE ps.bom_id = bom_record.id;
    
    -- Calcular custos indiretos
    SELECT COALESCE(SUM(ps.indirect_costs), 0)
    INTO ind_cost
    FROM erp_production_steps ps
    WHERE ps.bom_id = bom_record.id;
  END IF;
  
  -- Calcular custo de perdas
  loss_cost_calc := (raw_cost + lab_cost + ind_cost) * (product_record.average_loss_percentage / 100.0);
  
  -- Calcular custos totais
  total_prod_cost := raw_cost + lab_cost + ind_cost + loss_cost_calc;
  total_unit_cost_calc := total_prod_cost + product_record.allocated_fixed_cost;
  
  -- Calcular margens
  profit_margin_calc := product_record.sale_price - total_unit_cost_calc;
  
  IF product_record.sale_price > 0 THEN
    profit_margin_pct := (profit_margin_calc / product_record.sale_price) * 100;
  END IF;
  
  contribution_margin_calc := product_record.sale_price - total_prod_cost;
  
  -- Calcular ponto de equilíbrio
  IF contribution_margin_calc > 0 THEN
    break_even_calc := product_record.allocated_fixed_cost / contribution_margin_calc;
  END IF;
  
  -- Retornar resultados
  raw_materials_cost := raw_cost;
  labor_cost := lab_cost;
  indirect_costs := ind_cost;
  loss_cost := loss_cost_calc;
  total_production_cost := total_prod_cost;
  total_unit_cost := total_unit_cost_calc;
  profit_margin := profit_margin_calc;
  profit_margin_percentage := profit_margin_pct;
  contribution_margin := contribution_margin_calc;
  break_even_point := break_even_calc;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Atualizar triggers para usar tabela padrão
DROP TRIGGER IF EXISTS update_costs_on_product_change ON erp_products;
CREATE TRIGGER update_costs_on_product_change
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_variations_product_id ON products_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_products_variations_code ON products_variations(code);

-- Função para limpar tabela ERP antiga (opcional, executar apenas após confirmação)
CREATE OR REPLACE FUNCTION cleanup_old_erp_products()
RETURNS void AS $$
BEGIN
  -- Esta função pode ser executada após confirmação de que a migração foi bem-sucedida
  -- DROP TABLE IF EXISTS erp_products CASCADE;
  RAISE NOTICE 'Função de limpeza criada. Execute manualmente se necessário.';
END;
$$ LANGUAGE plpgsql;