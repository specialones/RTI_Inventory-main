-- ============================================================================
-- INVENTORY PRO DATABASE SCHEMA (COMPLETE FIXED VERSION)
-- WITH CUSTOM CONDITION VALUES: working-assigned, working-in storage, defective, damaged
-- WITH MANUAL ASSIGNED_TO FIELD (NO AUTO-CLEARING)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTION: Safe UUID conversion (handles empty strings)
-- ============================================================================
CREATE OR REPLACE FUNCTION safe_uuid(input_value TEXT)
RETURNS UUID AS $$
BEGIN
    IF input_value IS NULL OR 
       input_value = '' OR 
       input_value = 'null' OR 
       input_value = 'NULL' OR 
       input_value = '""' THEN
        RETURN NULL;
    END IF;
    
    BEGIN
        RETURN input_value::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FIRST: DROP ALL TABLES IN CORRECT ORDER (CASCADE to handle dependencies)
-- ============================================================================
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS validate_movement_type() CASCADE;
DROP FUNCTION IF EXISTS validate_reservation_status() CASCADE;
DROP FUNCTION IF EXISTS record_stock_movement(BIGINT, INTEGER, VARCHAR, TEXT, VARCHAR, UUID, INTEGER, VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS record_stock_movement(BIGINT, INTEGER, VARCHAR, TEXT, VARCHAR, UUID, INTEGER, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS record_stock_movement(BIGINT, INTEGER, VARCHAR, TEXT, VARCHAR, UUID) CASCADE;
DROP FUNCTION IF EXISTS transfer_stock(BIGINT, BIGINT, INTEGER, TEXT, VARCHAR, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS restore_archived_product(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS permanently_delete_product(INTEGER) CASCADE;

-- Drop views
DROP VIEW IF EXISTS stock_alerts CASCADE;
DROP VIEW IF EXISTS inventory_summary_by_building CASCADE;
DROP VIEW IF EXISTS movement_type_debug CASCADE;
DROP VIEW IF EXISTS archived_products_view CASCADE;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    permissions JSONB DEFAULT '[]'::JSONB,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'user')),
    CONSTRAINT valid_email CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Add self-references after table creation
ALTER TABLE users
ADD CONSTRAINT fk_users_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users
ADD CONSTRAINT fk_users_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_email_active ON users(email, is_active) WHERE is_active = true;
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- SYSTEM CONFIG
-- ============================================================================
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_system_config_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_system_config_updated_at ON system_config(updated_at);

-- ============================================================================
-- CATEGORIES
-- ============================================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT fk_categories_parent 
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_categories_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_categories_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categories_is_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- BUILDINGS
-- ============================================================================
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    address JSONB,
    location_address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT valid_code CHECK (code ~ '^[A-Z0-9_-]+$'),
    CONSTRAINT fk_buildings_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_buildings_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_buildings_code ON buildings(code) WHERE is_active = true;
CREATE INDEX idx_buildings_is_active ON buildings(is_active) WHERE is_active = true;

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(100),
    payment_terms VARCHAR(100),
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT valid_email CHECK (
        email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT fk_suppliers_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_suppliers_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_suppliers_code ON suppliers(code) WHERE is_active = true;
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active) WHERE is_active = true;
CREATE INDEX idx_suppliers_name ON suppliers(name) WHERE is_active = true;

-- ============================================================================
-- PRODUCTS TABLE - WITH MANUAL ASSIGNED_TO COLUMN (NO AUTO-CLEARING)
-- Valid values for condition: working-assigned, working-in storage, defective, damaged
-- ============================================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    condition VARCHAR(50) DEFAULT 'working-in storage',
    assigned_to VARCHAR(255),  -- Simple text field - YOU have full control, no auto-clearing!
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level INTEGER DEFAULT 0 CHECK (min_stock_level >= 0),
    max_stock_level INTEGER DEFAULT 0 CHECK (max_stock_level >= 0),
    unit_of_measure VARCHAR(20) DEFAULT 'unit',
    weight DECIMAL(10,3),
    dimensions JSONB,
    category_id INTEGER,
    supplier_id INTEGER,
    building_id INTEGER,
    reorder_level INTEGER DEFAULT 10 CHECK (reorder_level >= 0),
    reorder_quantity INTEGER DEFAULT 0 CHECK (reorder_quantity >= 0),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT valid_sku CHECK (sku ~ '^[A-Z0-9_-]+$'),
    CONSTRAINT fk_products_category 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_supplier 
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_building 
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_products_sku ON products(sku) WHERE is_active = true;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_building_id ON products(building_id);
CREATE INDEX idx_products_reorder_level ON products(reorder_level, stock_quantity) WHERE is_active = true;
CREATE INDEX idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_products_condition ON products(condition);
CREATE INDEX idx_products_assigned_to ON products(assigned_to);

-- ============================================================================
-- TRIGGER FUNCTION TO VALIDATE AND NORMALIZE CONDITION (FIXED)
-- Valid values: working-assigned, working-in storage, defective, damaged
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_and_normalize_condition()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle NULL or empty string - default to 'working-in storage'
    IF NEW.condition IS NULL OR NEW.condition = '' OR NEW.condition = 'null' OR NEW.condition = 'NULL' THEN
        NEW.condition := 'working-in storage';
        RETURN NEW;
    END IF;
    
    -- Trim whitespace
    NEW.condition := TRIM(NEW.condition);
    
    -- Check for exact matches first (case-sensitive for your values)
    -- This preserves the exact value if it's already one of the valid ones
    IF NEW.condition = 'working-assigned' OR 
       NEW.condition = 'working-in storage' OR 
       NEW.condition = 'defective' OR 
       NEW.condition = 'damaged' THEN
        -- Value is already correct, keep it as is
        RETURN NEW;
    END IF;
    
    -- Convert to lowercase for mapping common variations
    NEW.condition := LOWER(NEW.condition);
    
    -- Map common variations to your required values
    CASE NEW.condition
        -- Map to 'working-assigned'
        WHEN 'assigned', 'in use', 'checked out', 'issued', 'deployed' THEN
            NEW.condition := 'working-assigned';
        
        -- Map to 'working-in storage'
        WHEN 'working-in-storage', 'working in storage', 'in storage', 'available', 'stock', 'new', 'good', 'excellent' THEN
            NEW.condition := 'working-in storage';
        
        -- Map to 'defective'
        WHEN 'faulty', 'not working', 'malfunctioning', 'broken', 'repair needed', 'for repair' THEN
            NEW.condition := 'defective';
        
        -- Map to 'damaged'
        WHEN 'cracked', 'scratched', 'dented', 'bent', 'physical damage', 'cosmetic damage' THEN
            NEW.condition := 'damaged';
        
        -- If value is not recognized, default to 'working-in storage'
        ELSE
            NEW.condition := 'working-in storage';
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS validate_condition_trigger ON products;
CREATE TRIGGER validate_condition_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_and_normalize_condition();

-- ============================================================================
-- NOTE: NO AUTO-CLEARING TRIGGER FOR assigned_to!
-- You have full control to set assigned_to for ANY condition value
-- ============================================================================

-- ============================================================================
-- INVENTORY ITEMS
-- ============================================================================
CREATE TABLE inventory_items (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    building_id INTEGER NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INTEGER GENERATED ALWAYS AS 
        (stock_quantity - reserved_quantity) STORED,
    bin_location VARCHAR(50),
    batch_number VARCHAR(100),
    expiry_date DATE,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_inventory_items_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_items_building 
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_items_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_items_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(product_id, building_id, batch_number)
);

CREATE INDEX idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX idx_inventory_items_building_id ON inventory_items(building_id);
CREATE INDEX idx_inventory_items_reorder ON inventory_items(product_id, stock_quantity);
CREATE INDEX idx_inventory_items_expiry ON inventory_items(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_inventory_items_bin_location ON inventory_items(bin_location) WHERE bin_location IS NOT NULL;

-- ============================================================================
-- MOVEMENTS
-- ============================================================================
CREATE TABLE movements (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER,
    inventory_item_id BIGINT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    movement_type VARCHAR(20) NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    reference_number VARCHAR(100),
    reference VARCHAR(100),
    notes TEXT,
    old_quantity INTEGER,
    new_quantity INTEGER,
    user_id UUID,
    performed_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_movements_product 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_movements_inventory_item 
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL,
    CONSTRAINT fk_movements_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_movements_performed_by 
        FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_movements_product_id ON movements(product_id);
CREATE INDEX idx_movements_inventory_item_id ON movements(inventory_item_id);
CREATE INDEX idx_movements_created_at ON movements(created_at);
CREATE INDEX idx_movements_movement_type ON movements(movement_type);
CREATE INDEX idx_movements_reference_number ON movements(reference_number);
CREATE INDEX idx_movements_reference ON movements(reference);
CREATE INDEX idx_movements_reference_id ON movements(reference_id);
CREATE INDEX idx_movements_user_id ON movements(user_id);
CREATE INDEX idx_movements_performed_by ON movements(performed_by);

-- ============================================================================
-- RESERVATIONS
-- ============================================================================
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    inventory_item_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reference_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    expires_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_expiry CHECK (expires_at > created_at),
    CONSTRAINT fk_reservations_inventory_item 
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reservations_inventory_item_id ON reservations(inventory_item_id);
CREATE INDEX idx_reservations_reference ON reservations(reference_type, reference_id);
CREATE INDEX idx_reservations_status ON reservations(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_reservations_expires_at ON reservations(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- TRIGGER FUNCTION TO FIX EMPTY UUIDs
-- ============================================================================
CREATE OR REPLACE FUNCTION fix_empty_uuid_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'movements' THEN
        IF NEW.user_id IS NOT NULL AND NEW.user_id::TEXT = '' THEN
            NEW.user_id := NULL;
        END IF;
        IF NEW.performed_by IS NOT NULL AND NEW.performed_by::TEXT = '' THEN
            NEW.performed_by := NULL;
        END IF;
    END IF;

    IF TG_TABLE_NAME IN ('users', 'categories', 'buildings', 'suppliers', 'products', 'inventory_items', 'reservations') THEN
        IF NEW.created_by IS NOT NULL AND NEW.created_by::TEXT = '' THEN
            NEW.created_by := NULL;
        END IF;
    END IF;

    IF TG_TABLE_NAME IN ('users', 'categories', 'buildings', 'suppliers', 'products', 'inventory_items', 'reservations', 'system_config') THEN
        IF NEW.updated_by IS NOT NULL AND NEW.updated_by::TEXT = '' THEN
            NEW.updated_by := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER fix_empty_uuid_movements 
    BEFORE INSERT OR UPDATE ON movements 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_users 
    BEFORE INSERT OR UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_categories 
    BEFORE INSERT OR UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_buildings 
    BEFORE INSERT OR UPDATE ON buildings 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_suppliers 
    BEFORE INSERT OR UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_products 
    BEFORE INSERT OR UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_inventory_items 
    BEFORE INSERT OR UPDATE ON inventory_items 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_reservations 
    BEFORE INSERT OR UPDATE ON reservations 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

CREATE TRIGGER fix_empty_uuid_system_config 
    BEFORE INSERT OR UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION fix_empty_uuid_fields();

-- ============================================================================
-- TRIGGER FUNCTION TO VALIDATE MOVEMENT TYPES
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_movement_type()
RETURNS TRIGGER AS $$
BEGIN
    NEW.movement_type := UPPER(TRIM(NEW.movement_type));
    
    IF NEW.movement_type IN ('IN', 'RECEIVED', 'PURCHASE', 'PURCHASE_ORDER', 'PO') THEN
        NEW.movement_type := 'RECEIPT';
    ELSIF NEW.movement_type IN ('OUT', 'ISSUED', 'SALE', 'SALES_ORDER', 'SO', 'CONSUMPTION') THEN
        NEW.movement_type := 'ISSUE';
    ELSIF NEW.movement_type IN ('MOVE', 'RELOCATE', 'LOCATION_CHANGE') THEN
        NEW.movement_type := 'TRANSFER';
    ELSIF NEW.movement_type IN ('ADJ', 'CORRECTION', 'COUNT', 'INVENTORY_COUNT') THEN
        NEW.movement_type := 'ADJUSTMENT';
    ELSIF NEW.movement_type IN ('RTN', 'CUSTOMER_RETURN', 'RETURN_FROM_CUSTOMER') THEN
        NEW.movement_type := 'RETURN';
    ELSIF NEW.movement_type IN ('WO', 'SCRAP', 'DAMAGED', 'EXPIRED') THEN
        NEW.movement_type := 'WRITE_OFF';
    END IF;

    IF NEW.movement_type NOT IN ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'WRITE_OFF') THEN
        RAISE EXCEPTION 'Invalid movement_type: "%"', NEW.movement_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_movement_type_trigger
    BEFORE INSERT OR UPDATE ON movements
    FOR EACH ROW
    EXECUTE FUNCTION validate_movement_type();

-- ============================================================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STOCK MOVEMENT FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION record_stock_movement(
    p_inventory_item_id BIGINT,
    p_quantity INTEGER,
    p_movement_type VARCHAR,
    p_notes TEXT DEFAULT NULL,
    p_reference_number VARCHAR DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_product_id INTEGER DEFAULT NULL,
    p_reference VARCHAR DEFAULT NULL,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id VARCHAR DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_stock INTEGER;
    v_reserved INTEGER;
    v_product_id INTEGER;
    v_old_quantity INTEGER;
    v_new_quantity INTEGER;
    v_movement_id BIGINT;
    v_normalized_type VARCHAR;
    v_user_id UUID;
BEGIN
    v_user_id := p_user_id;
    v_normalized_type := UPPER(TRIM(p_movement_type));
    
    IF v_normalized_type IN ('IN', 'RECEIVED', 'PURCHASE', 'PURCHASE_ORDER', 'PO') THEN
        v_normalized_type := 'RECEIPT';
    ELSIF v_normalized_type IN ('OUT', 'ISSUED', 'SALE', 'SALES_ORDER', 'SO', 'CONSUMPTION') THEN
        v_normalized_type := 'ISSUE';
    ELSIF v_normalized_type IN ('MOVE', 'RELOCATE', 'LOCATION_CHANGE') THEN
        v_normalized_type := 'TRANSFER';
    ELSIF v_normalized_type IN ('ADJ', 'CORRECTION', 'COUNT', 'INVENTORY_COUNT') THEN
        v_normalized_type := 'ADJUSTMENT';
    ELSIF v_normalized_type IN ('RTN', 'CUSTOMER_RETURN', 'RETURN_FROM_CUSTOMER') THEN
        v_normalized_type := 'RETURN';
    ELSIF v_normalized_type IN ('WO', 'SCRAP', 'DAMAGED', 'EXPIRED') THEN
        v_normalized_type := 'WRITE_OFF';
    END IF;

    IF v_normalized_type NOT IN ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'WRITE_OFF') THEN
        RAISE EXCEPTION 'Invalid movement_type: "%"', p_movement_type;
    END IF;

    SELECT product_id, stock_quantity, reserved_quantity 
    INTO v_product_id, v_stock, v_reserved
    FROM inventory_items
    WHERE id = p_inventory_item_id
    FOR UPDATE;

    v_product_id := COALESCE(p_product_id, v_product_id);
    v_old_quantity := v_stock;

    IF v_normalized_type IN ('ISSUE', 'WRITE_OFF') THEN
        IF (v_stock - v_reserved) < p_quantity THEN
            RAISE EXCEPTION 'Not enough available stock. Available: %, Requested: %', (v_stock - v_reserved), p_quantity;
        END IF;
        v_new_quantity := v_stock - p_quantity;
        UPDATE inventory_items SET stock_quantity = v_new_quantity, updated_at = NOW() WHERE id = p_inventory_item_id;
    ELSIF v_normalized_type IN ('RECEIPT', 'RETURN') THEN
        v_new_quantity := v_stock + p_quantity;
        UPDATE inventory_items SET stock_quantity = v_new_quantity, updated_at = NOW() WHERE id = p_inventory_item_id;
    ELSIF v_normalized_type = 'TRANSFER' THEN
        v_new_quantity := v_stock - p_quantity;
        UPDATE inventory_items SET stock_quantity = v_new_quantity, updated_at = NOW() WHERE id = p_inventory_item_id;
    ELSIF v_normalized_type = 'ADJUSTMENT' THEN
        v_new_quantity := p_quantity;
        v_old_quantity := v_stock;
        UPDATE inventory_items SET stock_quantity = v_new_quantity, updated_at = NOW() WHERE id = p_inventory_item_id;
    END IF;

    IF v_normalized_type != 'ADJUSTMENT' THEN
        UPDATE products
        SET stock_quantity = stock_quantity + 
            CASE 
                WHEN v_normalized_type IN ('ISSUE', 'WRITE_OFF', 'TRANSFER') THEN -p_quantity
                WHEN v_normalized_type IN ('RECEIPT', 'RETURN') THEN p_quantity
                ELSE 0
            END,
            updated_at = NOW()
        WHERE id = v_product_id;
    ELSE
        UPDATE products
        SET stock_quantity = COALESCE((SELECT SUM(stock_quantity) FROM inventory_items WHERE product_id = v_product_id), 0),
            updated_at = NOW()
        WHERE id = v_product_id;
    END IF;

    INSERT INTO movements (
        product_id, inventory_item_id, quantity, movement_type, notes, 
        reference_number, reference, reference_type, reference_id,
        old_quantity, new_quantity, user_id, performed_by
    ) VALUES (
        v_product_id, p_inventory_item_id, p_quantity, v_normalized_type,
        p_notes, p_reference_number, p_reference, p_reference_type, p_reference_id,
        v_old_quantity, v_new_quantity, v_user_id, v_user_id
    ) RETURNING id INTO v_movement_id;

    RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRANSFER STOCK FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION transfer_stock(
    p_source_inventory_id BIGINT,
    p_destination_inventory_id BIGINT,
    p_quantity INTEGER,
    p_notes TEXT DEFAULT NULL,
    p_reference_number VARCHAR DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_source_product_id INTEGER;
    v_dest_product_id INTEGER;
BEGIN
    SELECT product_id INTO v_source_product_id
    FROM inventory_items WHERE id = p_source_inventory_id;
    
    SELECT product_id INTO v_dest_product_id
    FROM inventory_items WHERE id = p_destination_inventory_id;

    IF v_source_product_id != v_dest_product_id THEN
        RAISE EXCEPTION 'Cannot transfer between different products';
    END IF;

    PERFORM record_stock_movement(
        p_source_inventory_id, p_quantity, 'TRANSFER',
        COALESCE(p_notes, '') || ' - Transfer out', p_reference_number,
        p_user_id, v_source_product_id, NULL, 'TRANSFER_OUT', p_reference_number
    );

    PERFORM record_stock_movement(
        p_destination_inventory_id, p_quantity, 'RECEIPT',
        COALESCE(p_notes, '') || ' - Transfer in', p_reference_number,
        p_user_id, v_dest_product_id, NULL, 'TRANSFER_IN', p_reference_number
    );

    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RESTORE ARCHIVED PRODUCT
-- ============================================================================
CREATE OR REPLACE FUNCTION restore_archived_product(p_product_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE products
    SET is_active = true, deleted_at = NULL, updated_at = NOW()
    WHERE id = p_product_id AND is_active = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMANENTLY DELETE PRODUCT
-- ============================================================================
CREATE OR REPLACE FUNCTION permanently_delete_product(p_product_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_active BOOLEAN;
BEGIN
    SELECT is_active INTO v_is_active FROM products WHERE id = p_product_id;
    
    IF v_is_active IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_is_active = true THEN
        RAISE EXCEPTION 'Cannot permanently delete active product. Archive it first.';
    END IF;

    DELETE FROM movements WHERE product_id = p_product_id;
    DELETE FROM inventory_items WHERE product_id = p_product_id;
    DELETE FROM products WHERE id = p_product_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE VIEW stock_alerts AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.description,
    p.condition,
    p.assigned_to,
    p.stock_quantity,
    p.reorder_level,
    p.min_stock_level,
    p.max_stock_level,
    CASE 
        WHEN p.stock_quantity <= p.reorder_level THEN 'LOW_STOCK'
        WHEN p.stock_quantity >= p.max_stock_level THEN 'OVER_STOCK'
        WHEN p.stock_quantity <= p.min_stock_level THEN 'CRITICAL'
        ELSE 'OK'
    END AS stock_status,
    p.is_active
FROM products p
WHERE p.is_active = true AND p.deleted_at IS NULL;

CREATE VIEW inventory_summary_by_building AS
SELECT 
    b.id AS building_id,
    b.code AS building_code,
    b.name AS building_name,
    COUNT(DISTINCT ii.product_id) AS unique_products,
    SUM(ii.stock_quantity) AS total_stock_quantity,
    SUM(ii.reserved_quantity) AS total_reserved_quantity,
    SUM(ii.available_quantity) AS total_available_quantity,
    COUNT(DISTINCT CASE WHEN ii.stock_quantity <= p.reorder_level THEN ii.product_id END) AS products_below_reorder
FROM buildings b
LEFT JOIN inventory_items ii ON b.id = ii.building_id
LEFT JOIN products p ON ii.product_id = p.id
WHERE b.is_active = true AND b.deleted_at IS NULL
GROUP BY b.id, b.code, b.name;

CREATE VIEW archived_products_view AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.description,
    p.condition,
    p.assigned_to,
    p.stock_quantity,
    p.reorder_level,
    c.name AS category_name,
    b.name AS building_name,
    p.deleted_at AS archived_date,
    p.updated_by
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN buildings b ON p.building_id = b.id
WHERE p.is_active = false AND p.deleted_at IS NOT NULL
ORDER BY p.deleted_at DESC;

CREATE VIEW movement_type_debug AS
SELECT 
    movement_type,
    COUNT(*) as count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM movements
GROUP BY movement_type
ORDER BY movement_type;

-- ============================================================================
-- APPLY UPDATE TIMESTAMP TRIGGERS
-- ============================================================================
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        AND tablename IN ('users', 'categories', 'buildings', 'suppliers', 'products', 'inventory_items', 'reservations')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END;
$$;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

INSERT INTO users (id, email, full_name, password_hash, role, permissions) VALUES
    (gen_random_uuid(), 'admin@inventorypro.com', 'System Administrator',
     crypt('ChangeMe123!', gen_salt('bf')), 'admin', '["*"]'::JSONB)
ON CONFLICT (email) DO NOTHING;

-- Sample products with different conditions and assigned_to values (ALL conditions can have assigned_to text)
-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
DO $$
DECLARE
    v_user_count INTEGER;
    v_product_count INTEGER;
    v_working_assigned_count INTEGER;
    v_working_storage_count INTEGER;
    v_defective_count INTEGER;
    v_damaged_count INTEGER;
    v_assigned_not_null_count INTEGER;
    v_product_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM users;
    SELECT COUNT(*) INTO v_product_count FROM products;
    SELECT COUNT(*) INTO v_working_assigned_count FROM products WHERE condition = 'working-assigned';
    SELECT COUNT(*) INTO v_working_storage_count FROM products WHERE condition = 'working-in storage';
    SELECT COUNT(*) INTO v_defective_count FROM products WHERE condition = 'defective';
    SELECT COUNT(*) INTO v_damaged_count FROM products WHERE condition = 'damaged';
    SELECT COUNT(*) INTO v_assigned_not_null_count FROM products WHERE assigned_to IS NOT NULL;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATABASE CREATED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Users created: %', v_user_count;
    RAISE NOTICE 'Products created: %', v_product_count;
    RAISE NOTICE 'Default admin: admin@inventorypro.com';
    RAISE NOTICE 'Default password: ChangeMe123!';
    RAISE NOTICE '';
    RAISE NOTICE 'CONDITION VALUES:';
    RAISE NOTICE '✓ working-assigned - Count: %', v_working_assigned_count;
    RAISE NOTICE '✓ working-in storage - Count: %', v_working_storage_count;
    RAISE NOTICE '✓ defective - Count: %', v_defective_count;
    RAISE NOTICE '✓ damaged - Count: %', v_damaged_count;
    RAISE NOTICE '';
    RAISE NOTICE 'ASSIGNED_TO FIELD (FIXED):';
    RAISE NOTICE '✓ Text column - YOU have full control!';
    RAISE NOTICE '✓ NO auto-clearing - Set ANY text for ANY condition';
    RAISE NOTICE '✓ Products with assigned_to values: % out of %', v_assigned_not_null_count, v_product_count;
    RAISE NOTICE '';
    RAISE NOTICE 'SAMPLE PRODUCTS WITH ASSIGNED_TO:';
    
    FOR v_product_record IN 
        SELECT name, condition, assigned_to 
        FROM products 
        WHERE assigned_to IS NOT NULL
        LIMIT 5
    LOOP
        RAISE NOTICE '  - %: % -> Assigned to: %', 
            v_product_record.name, 
            v_product_record.condition,
            v_product_record.assigned_to;
    END LOOP;
    
    
    RAISE NOTICE '';
    RAISE NOTICE 'CHANGE DEFAULT PASSWORD IMMEDIATELY!';
    RAISE NOTICE '============================================';
END;
$$;