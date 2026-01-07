-- Additional Functions for Drug Stock Management
-- Run this after the main setup.sql

-- Function to reduce drug stock safely
CREATE OR REPLACE FUNCTION reduce_stock(drug_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.drugs
        WHERE id = drug_id AND stock_quantity >= quantity
    ) THEN
        UPDATE public.drugs
        SET stock_quantity = stock_quantity - quantity
        WHERE id = drug_id;
    ELSE
        RAISE EXCEPTION 'Insufficient stock for drug';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reduce_stock(UUID, INTEGER) TO authenticated;

-- Function to increase drug stock (for restocking)
CREATE OR REPLACE FUNCTION increase_stock(drug_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.drugs
    SET stock_quantity = stock_quantity + quantity
    WHERE id = drug_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increase_stock(UUID, INTEGER) TO authenticated;

-- Trigger to auto-update drug stock when prescription is created
-- Note: Uncomment this if you want automatic stock deduction on prescription creation
/*
CREATE OR REPLACE FUNCTION auto_reduce_stock_on_prescription()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.drugs
    SET stock_quantity = stock_quantity - 1
    WHERE id = NEW.drug_id AND stock_quantity > 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reduce_stock
    AFTER INSERT ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION auto_reduce_stock_on_prescription();
*/

-- Function to get low stock drugs
CREATE OR REPLACE FUNCTION get_low_stock_drugs()
RETURNS TABLE (
    drug_id UUID,
    drug_name TEXT,
    current_stock INTEGER,
    reorder_level INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.name,
        d.stock_quantity,
        d.reorder_level,
        CASE
            WHEN d.stock_quantity = 0 THEN 'Out of Stock'
            WHEN d.stock_quantity <= d.reorder_level THEN 'Low Stock'
            ELSE 'In Stock'
        END
    FROM public.drugs d
    WHERE d.stock_quantity <= d.reorder_level
    ORDER BY d.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_low_stock_drugs() TO authenticated;

-- Function to get daily statistics
CREATE OR REPLACE FUNCTION get_daily_stats(date_param DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_patients BIGINT,
    total_visits BIGINT,
    visits_completed BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.patients WHERE DATE(created_at) = date_param) as total_patients,
        (SELECT COUNT(*) FROM public.patient_visits WHERE DATE(visit_date) = date_param) as total_visits,
        (SELECT COUNT(*) FROM public.patient_visits WHERE DATE(visit_date) = date_param AND status = 'completed') as visits_completed,
        (SELECT COALESCE(SUM(total_amount), 0) FROM public.bills WHERE DATE(created_at) = date_param) as total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_daily_stats(DATE) TO authenticated;

-- Function to clean up old online users
CREATE OR REPLACE FUNCTION cleanup_old_online_users()
RETURNS void AS $$
BEGIN
    DELETE FROM public.online_users
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_old_online_users() TO authenticated;

-- Function to update user online status
CREATE OR REPLACE FUNCTION set_user_online(user_id_param UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.online_users (user_id, last_seen, expires_at)
    VALUES (user_id_param, NOW(), NOW() + INTERVAL '5 minutes')
    ON CONFLICT (user_id) DO UPDATE
    SET last_seen = NOW(), expires_at = NOW() + INTERVAL '5 minutes';

    UPDATE public.users
    SET is_online = TRUE
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_user_online(UUID) TO authenticated;

-- Function to set user offline
CREATE OR REPLACE FUNCTION set_user_offline(user_id_param UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM public.online_users WHERE user_id = user_id_param;
    UPDATE public.users SET is_online = FALSE WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_user_offline(UUID) TO authenticated;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_visits_visit_date ON public.patient_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_drugs_stock_low ON public.drugs(stock_quantity) WHERE stock_quantity <= reorder_level;
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_drug ON public.prescriptions(visit_id, drug_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_date ON public.bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_date ON public.messages(created_at DESC);
