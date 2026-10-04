-- Seed Data extracted from Belmarose LIQUOR ORDERING.xlsx
-- Includes realistic F&B categories, vendors, product master, and transactions

DO $$
DECLARE
    cat_beer UUID := uuid_generate_v4();
    cat_scotch UUID := uuid_generate_v4();
    cat_whiskey UUID := uuid_generate_v4();
    cat_vodka UUID := uuid_generate_v4();
    cat_rum UUID := uuid_generate_v4();
    cat_gin UUID := uuid_generate_v4();
    cat_tequila UUID := uuid_generate_v4();
    cat_wine UUID := uuid_generate_v4();
    cat_liqueur UUID := uuid_generate_v4();

    ven_allied UUID := uuid_generate_v4();
    ven_ub UUID := uuid_generate_v4();
    ven_pernod UUID := uuid_generate_v4();
    ven_bacardi UUID := uuid_generate_v4();
    ven_sula UUID := uuid_generate_v4();

    p_jager UUID := uuid_generate_v4();
    p_bud_beer UUID := uuid_generate_v4();
    p_bud_prem UUID := uuid_generate_v4();
    p_corona UUID := uuid_generate_v4();
    p_hoegaarden UUID := uuid_generate_v4();
    p_chivas UUID := uuid_generate_v4();
    p_bacardi_blanca UUID := uuid_generate_v4();
    p_bacardi_dlx UUID := uuid_generate_v4();
    p_skyy UUID := uuid_generate_v4();
    p_bulldog UUID := uuid_generate_v4();
    p_cabron UUID := uuid_generate_v4();
    p_ciroc UUID := uuid_generate_v4();
    p_double_black UUID := uuid_generate_v4();
    p_black_label UUID := uuid_generate_v4();
    p_jd UUID := uuid_generate_v4();
    p_jd_fire UUID := uuid_generate_v4();
    p_jd_honey UUID := uuid_generate_v4();
    p_merlot UUID := uuid_generate_v4();
    p_malbec UUID := uuid_generate_v4();
    p_pistola UUID := uuid_generate_v4();
BEGIN
    -- 1. Insert Categories
    INSERT INTO categories (id, name, slug, description, color_tag) VALUES
    (cat_beer, 'Beer & Ciders', 'beer', 'Bottles, cans, craft draft', '#D97706'),
    (cat_scotch, 'Scotch & Single Malt', 'scotch', 'Blended & single malt scotches', '#92400E'),
    (cat_whiskey, 'Whiskey & Bourbon', 'whiskey', 'American, Irish, Tennessee whiskeys', '#B45309'),
    (cat_vodka, 'Vodka', 'vodka', 'Premium grain & potato vodkas', '#0284C7'),
    (cat_rum, 'Rum', 'rum', 'White, dark, and spiced rums', '#DC2626'),
    (cat_gin, 'Gin', 'gin', 'London dry & botanical gins', '#059669'),
    (cat_tequila, 'Tequila & Mezcal', 'tequila', 'Blanco, Reposado & Añejo agave', '#EA580C'),
    (cat_wine, 'Wine & Champagne', 'wine', 'Red, white, sparkling & champagne', '#7C2D12'),
    (cat_liqueur, 'Liqueurs & Digestifs', 'liqueurs', 'Herbal, cream, and specialty spirits', '#4338CA')
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Insert Vendors
    INSERT INTO vendors (id, name, contact_person, phone, email, address, gstin, payment_terms) VALUES
    (ven_ub, 'United Breweries Distribution', 'Rajesh Sharma', '+91 98201 12345', 'orders@ubgroup-dist.com', 'Andheri East, Mumbai', '27AAACU1234F1Z5', 'Weekly Net 7'),
    (ven_allied, 'Allied Spirits & Premium Beverages', 'Vikram Malhotra', '+91 98210 54321', 'sales@alliedspirits.in', 'Lower Parel, Mumbai', '27AABCA5678G2Z1', 'Net 15 Days'),
    (ven_pernod, 'Pernod Ricard India Supply', 'Sanjay Patil', '+91 98222 99887', 'fnb.orders@pernod-ricard.in', 'Worli, Mumbai', '27AAACP9012H3Z4', 'Net 15 Days'),
    (ven_bacardi, 'Bacardi India Commercial Depot', 'Kavita Menon', '+91 98205 77665', 'depot@bacardi-supply.in', 'Bandra Kurla Complex, Mumbai', '27AAACB3456J4Z7', 'Net 30 Days'),
    (ven_sula, 'Sula Vineyards & Wine Cellars', 'Amit Deshmukh', '+91 98233 44556', 'institutional@sulawines.com', 'Govandi, Mumbai', '27AAACS7890K5Z9', 'Immediate / Cash');

    -- 3. Insert Products from Belmarose XLSX
    INSERT INTO products (
        id, sku, name, category_id, vendor_id, uom, cost_price, selling_price,
        current_stock, opening_stock, reorder_point, ideal_stock, min_order_qty,
        case_size, last_2week_sales, notes
    ) VALUES
    -- 1. JAGERMEISTER
    (p_jager, 'LIQ-JAG-001', 'JAGERMEISTER 700ML', cat_liqueur, ven_allied, 'BTL.', 4386.50, 900.00, 35.09, 38.16, 12.00, 48.00, 6.00, 12, 3.07, 'High margin digestive. Fast weekend shot sales.'),
    -- 2. BUDWEISER BEER
    (p_bud_beer, 'LIQ-BUD-002', 'BUDWEISER BEER 330ML', cat_beer, ven_ub, 'BTL.', 157.00, 850.00, 113.00, 199.00, 96.00, 360.00, 24.00, 24, 86.00, 'Top volume beer. Case size 24.'),
    -- 3. CORONA BEER
    (p_corona, 'LIQ-COR-003', 'CORONA EXTRA 330ML', cat_beer, ven_ub, 'BTL.', 185.00, 950.00, 419.00, 483.00, 120.00, 480.00, 24.00, 24, 64.00, 'High stock in hand after bulk delivery.'),
    -- 4. HOEGAARDEN
    (p_hoegaarden, 'LIQ-HOE-004', 'HOEGAARDEN WITBIER 330ML', cat_beer, ven_ub, 'BTL.', 173.00, 900.00, 213.00, 229.00, 48.00, 240.00, 24.00, 24, 16.00, 'Wheat beer, steady weekly movement.'),
    -- 5. CHIVAS 12 YRS
    (p_chivas, 'LIQ-CHV-005', 'CHIVAS REGAL 12 YRS 750ML', cat_scotch, ven_pernod, 'BTL.', 3971.00, 1200.00, 4.07, 4.17, 6.00, 18.00, 2.00, 12, 0.10, 'Reorder needed! Stock critically low.'),
    -- 6. BACARDI CARTA BLANCA
    (p_bacardi_blanca, 'LIQ-BAC-006', 'BACARDI CARTA BLANCA 750ML', cat_rum, ven_bacardi, 'BTL.', 1570.00, 750.00, 4.16, 6.31, 6.00, 24.00, 6.00, 12, 2.15, 'Core cocktail well rum.'),
    -- 7. SKYY VODKA
    (p_skyy, 'LIQ-SKY-007', 'SKYY VODKA 750ML', cat_vodka, ven_allied, 'BTL.', 1747.00, 750.00, 16.00, 32.10, 12.00, 36.00, 6.00, 12, 16.10, 'High velocity vodka for parties.'),
    -- 8. BULL DOG GIN
    (p_bulldog, 'LIQ-BDG-008', 'BULLDOG LONDON DRY GIN 750ML', cat_gin, ven_allied, 'BTL.', 1598.00, 650.00, 4.06, 15.20, 8.00, 24.00, 6.00, 12, 11.14, 'Fast selling craft gin.'),
    -- 9. CABRON TEQUILA
    (p_cabron, 'LIQ-CAB-009', 'CABRON TEQUILA BLANCO 750ML', cat_tequila, ven_allied, 'BTL.', 1390.00, 800.00, 19.18, 23.35, 10.00, 30.00, 6.00, 12, 4.17, 'House pouring tequila.'),
    -- 10. CIROC VODKA
    (p_ciroc, 'LIQ-CIR-010', 'CIROC ULTRA PREMIUM VODKA 750ML', cat_vodka, ven_allied, 'BTL.', 4756.00, 1250.00, 1.02, 2.03, 3.00, 8.00, 1.00, 6, 1.01, 'Ultra premium French grape vodka.'),
    -- 11. DOUBLE BLACK
    (p_double_black, 'LIQ-JW-011', 'JOHNNIE WALKER DOUBLE BLACK 750ML', cat_scotch, ven_allied, 'BTL.', 4987.00, 1150.00, 0.00, 0.18, 2.00, 6.00, 1.00, 6, 0.18, 'OUT OF STOCK. Urgent reorder!'),
    -- 12. JACK DANIELS OLD NO. 7
    (p_jd, 'LIQ-JD-012', 'JACK DANIELS OLD NO. 7 750ML', cat_whiskey, ven_allied, 'BTL.', 3509.00, 850.00, 3.02, 6.22, 6.00, 18.00, 2.00, 12, 3.20, 'Consistent customer favorite.'),
    -- 13. LE PETIT MERLOT
    (p_merlot, 'LIQ-WIN-013', 'LE PETIT MERLOT FRENCH RED 750ML', cat_wine, ven_sula, 'BTL.', 1750.00, 6500.00, 1.00, 2.00, 3.00, 10.00, 2.00, 6, 1.00, 'Premium bottle wine sales.'),
    -- 14. SANTA JULIA MALBEC
    (p_malbec, 'LIQ-WIN-014', 'SANTA JULIA MALBEC ARGENTINA 750ML', cat_wine, ven_sula, 'BTL.', 2595.00, 8000.00, 3.00, 3.00, 3.00, 8.00, 2.00, 6, 0.00, 'Reserve wine collection.'),
    -- 15. MYA PISTOLA REPOSADO
    (p_pistola, 'LIQ-PIS-015', 'MAYA PISTOLA AGAVE REPOSADO 750ML', cat_tequila, ven_allied, 'BTL.', 3658.00, 950.00, 0.17, 0.17, 3.00, 8.00, 2.00, 6, 0.00, 'Craft Indian 100% agave.'),
    -- 16. BLACK LABEL
    (p_black_label, 'LIQ-JW-016', 'JOHNNIE WALKER BLACK LABEL 750ML', cat_scotch, ven_allied, 'BTL.', 4250.00, 1050.00, 0.00, 0.18, 4.00, 12.00, 2.00, 12, 0.18, 'OUT OF STOCK. Urgent reorder!'),
    -- 17. JACK DANIELS FIRE
    (p_jd_fire, 'LIQ-JD-017', 'JACK DANIELS TENNESSEE FIRE 750ML', cat_whiskey, ven_allied, 'BTL.', 3509.17, 850.00, 0.12, 0.14, 2.00, 6.00, 1.00, 6, 0.02, 'Cinnamon flavored shot whiskey.'),
    -- 18. JACK DANIELS HONEY
    (p_jd_honey, 'LIQ-JD-018', 'JACK DANIELS TENNESSEE HONEY 750ML', cat_whiskey, ven_allied, 'BTL.', 3509.17, 850.00, 0.00, 0.00, 2.00, 6.00, 1.00, 6, 0.00, 'Honey liquor whiskey.'),
    -- 19. BACARDI CARTA ULTRA DLX RUM
    (p_bacardi_dlx, 'LIQ-BAC-019', 'BACARDI CARTA ULTRA DLX RUM 750ML', cat_rum, ven_bacardi, 'BTL.', 1700.00, 750.00, 213.00, 219.20, 24.00, 120.00, 12.00, 12, 6.20, 'Premium dark aged rum.'),
    -- 20. BUDWEISER PREMIUM BEER
    (p_bud_prem, 'LIQ-BUD-020', 'BUDWEISER MAGNUM PREMIUM BEER 330ML', cat_beer, ven_ub, 'BTL.', 156.99, 950.00, 0.00, 151.00, 48.00, 240.00, 24.00, 24, 151.00, 'Sold out! High velocity over 150 btls/2wk.')
    ON CONFLICT (sku) DO NOTHING;

    -- 4. Insert Initial Stock Movements (Audit trail)
    INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, notes)
    VALUES
    (p_bud_beer, 'initial_setup', 113.00, 0.00, 113.00, 'Initial Belmarose stock capture from sheet'),
    (p_corona, 'initial_setup', 419.00, 0.00, 419.00, 'Initial Belmarose stock capture from sheet'),
    (p_chivas, 'initial_setup', 4.07, 0.00, 4.07, 'Initial Belmarose stock capture from sheet'),
    (p_skyy, 'initial_setup', 16.00, 0.00, 16.00, 'Initial Belmarose stock capture from sheet');

    -- 5. Insert Sample Discrepancy for Demo
    INSERT INTO discrepancies (
        product_id, date, expected_qty, actual_qty, variance, variance_value, status, resolution_notes, reviewed_by
    ) VALUES
    (p_chivas, CURRENT_DATE - INTERVAL '1 day', 4.17, 4.07, -0.10, -397.10, 'investigating', 'Variance noticed after Sunday high-rush shift. Checking bar cameras & spillage book.', 'Admin'),
    (p_skyy, CURRENT_DATE - INTERVAL '3 days', 17.50, 16.00, -1.50, -2620.50, 'resolved', 'Bottle dropped and broken during bar restock. Wastage slip recorded.', 'Manager');

    -- 6. Insert Sample Wastage Logs
    INSERT INTO wastage_logs (product_id, quantity, reason, cost_impact, logged_by, notes) VALUES
    (p_skyy, 1.50, 'breakage', 2620.50, 'Staff: Rohan', 'Accidental drop during Friday evening peak hour restock.'),
    (p_bud_beer, 2.00, 'spoilage', 314.00, 'Staff: Amit', 'Damaged seals / flat carbonation reported by table 14.');

END $$;
