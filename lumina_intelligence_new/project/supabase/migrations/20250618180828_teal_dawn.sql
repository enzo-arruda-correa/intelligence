/*
  # Fix product triggers referencing non-existent product_id field

  1. Problem
    - Database triggers are trying to access NEW.product_id on erp_products table
    - The erp_products table has 'id' field, not 'product_id'
    - This causes "record 'new' has no field 'product_id'" error

  2. Solution
    - Update trigger functions to use NEW.id instead of NEW.product_id
    - Ensure all triggers reference the correct column names
*/

-- First, let's check if the update_cost_calculations_cache function exists and fix it
CREATE OR REPLACE FUNCTION update_cost_calculations_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- For erp_products table, use NEW.id (not NEW.product_id)
  IF TG_TABLE_NAME = 'erp_products' THEN
    -- Update or insert cost calculation for this product
    INSERT INTO erp_cost_calculations (product_id)
    VALUES (NEW.id)
    ON CONFLICT (product_id) DO UPDATE SET
      calculated_at = now();
    RETURN NEW;
  END IF;

  -- For erp_bom table, use NEW.product_id
  IF TG_TABLE_NAME = 'erp_bom' THEN
    INSERT INTO erp_cost_calculations (product_id)
    VALUES (NEW.product_id)
    ON CONFLICT (product_id) DO UPDATE SET
      calculated_at = now();
    RETURN NEW;
  END IF;

  -- For erp_bom_items table, get product_id through bom
  IF TG_TABLE_NAME = 'erp_bom_items' THEN
    INSERT INTO erp_cost_calculations (product_id)
    SELECT b.product_id
    FROM erp_bom b
    WHERE b.id = NEW.bom_id
    ON CONFLICT (product_id) DO UPDATE SET
      calculated_at = now();
    RETURN NEW;
  END IF;

  -- For erp_production_steps table, get product_id through bom
  IF TG_TABLE_NAME = 'erp_production_steps' THEN
    INSERT INTO erp_cost_calculations (product_id)
    SELECT b.product_id
    FROM erp_bom b
    WHERE b.id = NEW.bom_id
    ON CONFLICT (product_id) DO UPDATE SET
      calculated_at = now();
    RETURN NEW;
  END IF;

  -- For erp_raw_materials table, update all products that use this material
  IF TG_TABLE_NAME = 'erp_raw_materials' THEN
    INSERT INTO erp_cost_calculations (product_id)
    SELECT DISTINCT b.product_id
    FROM erp_bom b
    JOIN erp_bom_items bi ON bi.bom_id = b.id
    WHERE bi.raw_material_id = NEW.id
    ON CONFLICT (product_id) DO UPDATE SET
      calculated_at = now();
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers to ensure they use the updated function
DROP TRIGGER IF EXISTS update_costs_on_product_change ON erp_products;
CREATE TRIGGER update_costs_on_product_change
  AFTER INSERT OR UPDATE ON erp_products
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

DROP TRIGGER IF EXISTS update_costs_on_bom_change ON erp_bom;
CREATE TRIGGER update_costs_on_bom_change
  AFTER INSERT OR DELETE OR UPDATE ON erp_bom
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

DROP TRIGGER IF EXISTS update_costs_on_bom_items_change ON erp_bom_items;
CREATE TRIGGER update_costs_on_bom_items_change
  AFTER INSERT OR DELETE OR UPDATE ON erp_bom_items
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

DROP TRIGGER IF EXISTS update_costs_on_production_steps_change ON erp_production_steps;
CREATE TRIGGER update_costs_on_production_steps_change
  AFTER INSERT OR DELETE OR UPDATE ON erp_production_steps
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();

DROP TRIGGER IF EXISTS update_costs_on_material_cost_change ON erp_raw_materials;
CREATE TRIGGER update_costs_on_material_cost_change
  AFTER UPDATE OF unit_cost ON erp_raw_materials
  FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_cache();