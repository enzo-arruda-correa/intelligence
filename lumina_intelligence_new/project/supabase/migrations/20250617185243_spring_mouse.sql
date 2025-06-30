/*
  # Schema ERP - Integração com Sistema Existente

  1. Novas Tabelas
    - `erp_products` - Produtos do sistema ERP
    - `erp_raw_materials` - Insumos/matérias-primas
    - `erp_suppliers` - Fornecedores
    - `erp_bom` - Lista de materiais (Bill of Materials)
    - `erp_bom_items` - Itens da lista de materiais
    - `erp_production_steps` - Etapas de produção
    - `erp_production_orders` - Ordens de produção
    - `erp_stock_movements` - Movimentações de estoque
    - `erp_cost_calculations` - Cálculos de custos

  2. Relacionamentos
    - Integração com tabelas existentes de usuários
    - Relacionamentos entre produtos, insumos e ordens de produção
    - Histórico de movimentações e cálculos

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas baseadas no usuário autenticado
*/

-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS erp_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  contact text,
  email text,
  phone text,
  lead_time integer DEFAULT 7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Insumos/Matérias-primas
CREATE TABLE IF NOT EXISTS erp_raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  unit text NOT NULL,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  current_stock numeric(12,3) NOT NULL DEFAULT 0,
  minimum_stock numeric(12,3) NOT NULL DEFAULT 0,
  waste_percentage numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Tabela de relacionamento entre insumos e fornecedores
CREATE TABLE IF NOT EXISTS erp_material_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES erp_raw_materials(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES erp_suppliers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(material_id, supplier_id)
);

-- Tabela de Produtos ERP
CREATE TABLE IF NOT EXISTS erp_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  allocated_fixed_cost numeric(12,2) DEFAULT 0,
  production_time integer DEFAULT 0, -- em minutos
  average_loss_percentage numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Tabela de Lista de Materiais (BOM)
CREATE TABLE IF NOT EXISTS erp_bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES erp_products(id) ON DELETE CASCADE UNIQUE,
  total_production_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Itens da Lista de Materiais
CREATE TABLE IF NOT EXISTS erp_bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid REFERENCES erp_bom(id) ON DELETE CASCADE,
  raw_material_id uuid REFERENCES erp_raw_materials(id) ON DELETE CASCADE,
  quantity numeric(12,3) NOT NULL,
  unit text NOT NULL,
  waste_adjusted_quantity numeric(12,3) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Etapas de Produção
CREATE TABLE IF NOT EXISTS erp_production_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid REFERENCES erp_bom(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  time_minutes integer DEFAULT 0,
  labor_cost_per_hour numeric(10,2) DEFAULT 0,
  indirect_costs numeric(10,2) DEFAULT 0,
  average_loss numeric(5,2) DEFAULT 0,
  step_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Ordens de Produção
CREATE TABLE IF NOT EXISTS erp_production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES erp_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  status text NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  planned_date timestamptz NOT NULL,
  completed_date timestamptz,
  actual_cost numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS erp_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_material_id uuid REFERENCES erp_raw_materials(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity numeric(12,3) NOT NULL,
  reason text NOT NULL,
  production_order_id uuid REFERENCES erp_production_orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Cálculos de Custos (cache)
CREATE TABLE IF NOT EXISTS erp_cost_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES erp_products(id) ON DELETE CASCADE,
  raw_materials_cost numeric(12,2) DEFAULT 0,
  labor_cost numeric(12,2) DEFAULT 0,
  indirect_costs numeric(12,2) DEFAULT 0,
  loss_cost numeric(12,2) DEFAULT 0,
  total_production_cost numeric(12,2) DEFAULT 0,
  fixed_cost_allocation numeric(12,2) DEFAULT 0,
  total_unit_cost numeric(12,2) DEFAULT 0,
  profit_margin numeric(12,2) DEFAULT 0,
  profit_margin_percentage numeric(8,4) DEFAULT 0,
  break_even_point numeric(12,2) DEFAULT 0,
  contribution_margin numeric(12,2) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_erp_raw_materials_user_id ON erp_raw_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_raw_materials_code ON erp_raw_materials(code);
CREATE INDEX IF NOT EXISTS idx_erp_products_user_id ON erp_products(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_products_code ON erp_products(code);
CREATE INDEX IF NOT EXISTS idx_erp_products_category ON erp_products(category);
CREATE INDEX IF NOT EXISTS idx_erp_production_orders_user_id ON erp_production_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_production_orders_status ON erp_production_orders(status);
CREATE INDEX IF NOT EXISTS idx_erp_production_orders_planned_date ON erp_production_orders(planned_date);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_user_id ON erp_stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_material_id ON erp_stock_movements(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_erp_stock_movements_created_at ON erp_stock_movements(created_at);

-- Habilitar RLS
ALTER TABLE erp_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_material_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_production_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_cost_calculations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Fornecedores
CREATE POLICY "Users can manage own suppliers"
  ON erp_suppliers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para Insumos
CREATE POLICY "Users can manage own raw materials"
  ON erp_raw_materials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para Relacionamento Material-Fornecedor
CREATE POLICY "Users can manage own material suppliers"
  ON erp_material_suppliers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM erp_raw_materials rm 
      WHERE rm.id = material_id AND rm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_raw_materials rm 
      WHERE rm.id = material_id AND rm.user_id = auth.uid()
    )
  );

-- Políticas RLS para Produtos
CREATE POLICY "Users can manage own products"
  ON erp_products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para BOM
CREATE POLICY "Users can manage own BOMs"
  ON erp_bom
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM erp_products p 
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_products p 
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  );

-- Políticas RLS para Itens da BOM
CREATE POLICY "Users can manage own BOM items"
  ON erp_bom_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM erp_bom b
      JOIN erp_products p ON p.id = b.product_id
      WHERE b.id = bom_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_bom b
      JOIN erp_products p ON p.id = b.product_id
      WHERE b.id = bom_id AND p.user_id = auth.uid()
    )
  );

-- Políticas RLS para Etapas de Produção
CREATE POLICY "Users can manage own production steps"
  ON erp_production_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM erp_bom b
      JOIN erp_products p ON p.id = b.product_id
      WHERE b.id = bom_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_bom b
      JOIN erp_products p ON p.id = b.product_id
      WHERE b.id = bom_id AND p.user_id = auth.uid()
    )
  );

-- Políticas RLS para Ordens de Produção
CREATE POLICY "Users can manage own production orders"
  ON erp_production_orders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para Movimentações de Estoque
CREATE POLICY "Users can manage own stock movements"
  ON erp_stock_movements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para Cálculos de Custos
CREATE POLICY "Users can view own cost calculations"
  ON erp_cost_calculations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM erp_products p 
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_products p 
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  );