/*
  # Funções e Triggers para o Sistema ERP

  1. Funções
    - Atualização automática de timestamps
    - Cálculo automático de quantidades ajustadas por desperdício
    - Atualização de estoque em movimentações
    - Cálculo de custos de produtos

  2. Triggers
    - Atualização de updated_at
    - Recálculo automático de custos
    - Validação de estoque
*/

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para calcular quantidade ajustada por desperdício
CREATE OR REPLACE FUNCTION calculate_waste_adjusted_quantity()
RETURNS TRIGGER AS $$
DECLARE
  waste_pct numeric;
BEGIN
  -- Buscar percentual de desperdício do material
  SELECT waste_percentage INTO waste_pct
  FROM erp_raw_materials
  WHERE id = NEW.raw_material_id;
  
  -- Calcular quantidade ajustada
  NEW.waste_adjusted_quantity = NEW.quantity * (1 + COALESCE(waste_pct, 0) / 100);
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para atualizar estoque após movimentação
CREATE OR REPLACE FUNCTION update_stock_after_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'IN' THEN
    UPDATE erp_raw_materials 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.raw_material_id;
  ELSIF NEW.type = 'OUT' THEN
    UPDATE erp_raw_materials 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.raw_material_id;
  ELSIF NEW.type = 'ADJUSTMENT' THEN
    UPDATE erp_raw_materials 
    SET current_stock = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.raw_material_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para calcular custos de produto
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
  product_record erp_products%ROWTYPE;
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
  -- Buscar produto
  SELECT * INT FROM products;
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
$$ language 'plpgsql';

-- Função para atualizar cache de cálculos de custos
CREATE OR REPLACE FUNCTION update_cost_calculations_cache()
RETURNS TRIGGER AS $$
DECLARE
  costs_record RECORD;
BEGIN
  -- Calcular custos para o produto
  SELECT * INTO costs_record 
  FROM calculate_product_costs(COALESCE(NEW.product_id, OLD.product_id));
  
  -- Inserir ou atualizar cache
  INSERT INTO erp_cost_calculations (
    product_id,
    raw_materials_cost,
    labor_cost,
    indirect_costs,
    loss_cost,
    total_production_cost,
    fixed_cost_allocation,
    total_unit_cost,
    profit_margin,
    profit_margin_percentage,
    break_even_point,
    contribution_margin,
    calculated_at
  ) VALUES (
    COALESCE(NEW.product_id, OLD.product_id),
    costs_record.raw_materials_cost,
    costs_record.labor_cost,
    costs_record.indirect_costs,
    costs_record.loss_cost,
    costs_record.total_production_cost,
    (SELECT allocated_fixed_cost FROM erp_products WHERE id = COALESCE(NEW.product_id, OLD.product_id)),
    costs_record.total_unit_cost,
    costs_record.profit_margin,
    costs_record.profit_margin_percentage,
    costs_record.break_even_point,
    costs_record.contribution_margin,
    now()
  )
  ON CONFLICT (product_id) 
  DO UPDATE SET
    raw_materials_cost = EXCLUDED.raw_materials_cost,
    labor_cost = EXCLUDED.labor_cost,
    indirect_costs = EXCLUDED.indirect_costs,
    loss_cost = EXCLUDED.loss_cost,
    total_production_cost = EXCLUDED.total_production_cost,
    fixed_cost_allocation = EXCLUDED.fixed_cost_allocation,
    total_unit_cost = EXCLUDED.total_unit_cost,
    profit_margin = EXCLUDED.profit_margin,
    profit_margin_percentage = EXCLUDED.profit_margin_percentage,
    break_even_point = EXCLUDED.break_even_point,
    contribution_margin = EXCLUDED.contribution_margin,
    calculated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_erp_suppliers_updated_at
  BEFORE UPDATE ON erp_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_raw_materials_updated_at
  BEFORE UPDATE ON erp_raw_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_products_updated_at
  BEFORE UPDATE ON erp_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_bom_updated_at
  BEFORE UPDATE ON erp_bom
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular quantidade ajustada por desperdício
CREATE TRIGGER calculate_waste_adjusted_quantity_trigger
  BEFORE INSERT OR UPDATE ON erp_bom_items
  FOR EACH ROW EXECUTE FUNCTION calculate_waste_adjusted_quantity();

-- Trigger para atualizar estoque
CREATE TRIGGER update_stock_trigger
  AFTER INSERT ON erp_stock_movements
  FOR EACH ROW EXECUTE FUNCTION update_stock_after_movement();

-- Triggers para atualizar cache de custos
CREATE TRIGGER update_costs_on_product_change
  AFTER INSERT OR UPDATE ON erp_products
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

CREATE TRIGGER update_costs_on_bom_change
  AFTER INSERT OR UPDATE OR DELETE ON erp_bom
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

CREATE TRIGGER update_costs_on_bom_items_change
  AFTER INSERT OR UPDATE OR DELETE ON erp_bom_items
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

CREATE TRIGGER update_costs_on_production_steps_change
  AFTER INSERT OR UPDATE OR DELETE ON erp_production_steps
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

CREATE TRIGGER update_costs_on_material_cost_change
  AFTER UPDATE OF unit_cost ON erp_raw_materials
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();