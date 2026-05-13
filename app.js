/**
 * Inventory Pro - Complete Application Logic (MERGED VERSION with Soft Delete)
 * Features:
 * - bcrypt password hashing
 * - Enhanced ID search with highlighting
 * - Mobile menu support
 * - Soft delete for products with movement history
 * - ID filtering 1-1000 range
 * - Product Condition field
 * - Category filter in search bar (use "category:" prefix)
 * - Stock adjustment shows only defective products
 * - Enhanced practical dashboard statistics with building breakdown
 * - Interface toggle (Computer Equipment & Electronics / Office Supplies & Consumables)
 * - Sidebar toggle button for switching interfaces
 * - Pagination for Assets Management with navigation buttons
 * - Clickable sidebar toggle on all devices
 * - Full search across all fields with pagination support
 * - Search on Enter key press only
 */
'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DatabaseConfig = {
    // Interface 1 - Computer Equipment & Electronics
    interface1: {
        supabaseUrl: 'https://gawfomcajlzvcslzfwiu.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhd2ZvbWNhamx6dmNzbHpmd2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTA5MDksImV4cCI6MjA5MDYyNjkwOX0.Rlrtel3bEqwpGpWS5_-1gLV0ZUrlN3Fvgalgc3cJB7s',
        label: 'Computer Equipment & Electronics',
        shortLabel: 'Computer & Electronics'
    },
    // Interface 2 - Office Supplies & Consumables
    interface2: {
        supabaseUrl: 'https://unwwnhnwwxdayjhcqsew.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud3duaG53d3hkYXlqaGNxc2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDE0MjAsImV4cCI6MjA5MDExNzQyMH0.IvQ0k7EtwYte57hkDwbKTX-lNDpwlKyS4qHJhpF9C9U',
        label: 'Office Supplies & Consumables',
        shortLabel: 'Office Supplies'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const SupabaseManager = {
    clients: {},
    
    initializeClients() {
        try {
            // Initialize Interface 1 client
            if (DatabaseConfig.interface1.supabaseUrl && DatabaseConfig.interface1.supabaseKey) {
                this.clients.interface1 = supabase.createClient(
                    DatabaseConfig.interface1.supabaseUrl,
                    DatabaseConfig.interface1.supabaseKey
                );
                console.log('Interface 1 Supabase client initialized (Computer Equipment & Electronics)');
            }
            
            // Initialize Interface 2 client
            if (DatabaseConfig.interface2.supabaseUrl && DatabaseConfig.interface2.supabaseKey) {
                this.clients.interface2 = supabase.createClient(
                    DatabaseConfig.interface2.supabaseUrl,
                    DatabaseConfig.interface2.supabaseKey
                );
                console.log('Interface 2 Supabase client initialized (Office Supplies & Consumables)');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase clients:', error);
            return false;
        }
    },
    
    getClient(interfaceName = null) {
        if (!interfaceName) {
            interfaceName = AppState.currentInterface;
        }
        
        const client = this.clients[interfaceName];
        if (!client) {
            console.error(`No Supabase client found for interface: ${interfaceName}`);
            return null;
        }
        return client;
    },
    
    getCurrentClient() {
        return this.getClient(AppState.currentInterface);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL HELPERS FOR SUPABASE ACCESS
// ═══════════════════════════════════════════════════════════════════════════════

window.getSupabaseClient = () => SupabaseManager.getCurrentClient();
window.getInterfaceClient = (interfaceName) => SupabaseManager.getClient(interfaceName);

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC STYLES INJECTION
// ═══════════════════════════════════════════════════════════════════════════════

function injectStyles() {
    // Pagination Styles
    if (!document.querySelector('#pagination-styles')) {
        const paginationStyle = document.createElement('style');
        paginationStyle.id = 'pagination-styles';
        paginationStyle.textContent = `
            .pagination-wrapper {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                margin-top: 16px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 12px;
                flex-wrap: wrap;
                gap: 12px;
            }

            .pagination-info {
                color: var(--text-secondary);
                font-size: 13px;
                font-weight: 500;
                white-space: nowrap;
            }

            .pagination-controls {
                display: flex;
                align-items: center;
                gap: 4px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .pagination-btn {
                min-width: 36px;
                height: 36px;
                padding: 0 10px;
                border: 1px solid var(--border);
                background: var(--surface-light);
                color: var(--text-secondary);
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-family: inherit;
            }

            .pagination-btn:hover:not(:disabled) {
                background: var(--surface-hover);
                color: var(--text);
                border-color: var(--primary);
                transform: translateY(-1px);
            }

            .pagination-btn.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(67, 97, 238, 0.3);
            }

            .pagination-btn:disabled {
                opacity: 0.35;
                cursor: not-allowed;
                transform: none;
            }

            .pagination-ellipsis {
                padding: 0 4px;
                color: var(--text-muted);
                font-size: 14px;
                user-select: none;
            }

            .pagination-per-page {
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
            }

            .pagination-per-page label {
                color: var(--text-secondary);
                font-size: 12px;
                font-weight: 500;
            }

            .pagination-per-page select {
                background: var(--surface-light);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 7px 30px 7px 12px;
                color: var(--text);
                font-size: 13px;
                cursor: pointer;
                appearance: none;
                -webkit-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b92b0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 10px center;
            }

            .pagination-per-page select:hover {
                border-color: var(--primary);
            }

            .pagination-per-page select:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
            }

            .interface-2 .pagination-btn.active {
                background: #6366f1;
                border-color: #6366f1;
                box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
            }

            .interface-2 .pagination-btn:hover:not(:disabled) {
                border-color: #818cf8;
            }

            .interface-2 .pagination-per-page select:focus {
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
            }

            @media (max-width: 768px) {
                .pagination-wrapper {
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                
                .pagination-info {
                    text-align: center;
                    font-size: 12px;
                }
                
                .pagination-btn {
                    min-width: 32px;
                    height: 32px;
                    font-size: 12px;
                    padding: 0 8px;
                }
                
                .pagination-per-page {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(paginationStyle);
    }

    // Notification Styles
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .highlight-row {
                animation: highlight 1s ease-in-out;
                background-color: #fff3cd !important;
            }
            @keyframes highlight {
                0% { background-color: #ffeb3b; }
                100% { background-color: #fff3cd; }
            }
            .product-archived {
                opacity: 0.7;
                text-decoration: line-through;
            }
            .archived-badge {
                background: #6c757d;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                margin-left: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    // Interface Toggle Styles
    if (!document.querySelector('#interface-toggle-styles')) {
        const interfaceStyle = document.createElement('style');
        interfaceStyle.id = 'interface-toggle-styles';
        interfaceStyle.textContent = `
            .interface-toggle {
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                user-select: none;
            }
            .interface-toggle:hover {
                opacity: 0.8;
                transform: scale(1.02);
            }
            .interface-toggle:active {
                transform: scale(0.98);
            }
            .interface-badge {
                font-size: 10px;
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 10px;
                margin-left: 8px;
                vertical-align: middle;
                font-weight: normal;
            }
            .interface-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
                margin-bottom: 5px;
            }
            .interface-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: rgba(0,0,0,0.9);
            }
            .interface-toggle:hover .interface-tooltip {
                opacity: 1;
            }
            .database-indicator {
                font-size: 11px;
                padding: 4px 8px;
                border-radius: 4px;
                margin-top: 5px;
                display: inline-block;
            }
            .database-indicator.interface1 {
                background: rgba(67, 97, 238, 0.2);
                color: #daf0ea;
                border: 1px solid rgba(67, 97, 238, 0.3);
            }
            .database-indicator.interface2 {
                background: rgba(99,102,241,0.5);
                color: #daf0ea;
                border: 2px solid rgba(99,102,241,0.5);
            }
            .interface-switch-btn {
                background: linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%) !important;
                border: 1px solid rgba(99,102,241,0.3) !important;
                margin-bottom: var(--space-3) !important;
                animation: subtlePulse 2s infinite ease-in-out;
            }
            .interface-2 .interface-switch-btn {
                background: linear-gradient(135deg, #4361ee 100%) !important;
                border: 1px solid rgba(99, 102, 241, 0.3) !important;
            }
            .interface-switch-btn:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 20px rgba(99,102,241,0.3) !important;
            }
            .interface-2 .interface-switch-btn:hover {
                box-shadow: 0 6px 20px rgba(99,104,241,0.3) !important;
            }
            @keyframes subtlePulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
                50% { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
            }
            .interface-2 .interface-switch-btn {
                animation-name: subtlePulseBlue;
            }
            @keyframes subtlePulseBlue {
                0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
                50% { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
            }
            .interface-2 .stat-card {
                border-radius: 8px;
                padding: 25px 20px;
                background: linear-gradient(135deg,#667eea 0%,#764ba2 100%);
            }
            .interface-2 .dashboard-grid,
            .interface-2 .dashboard-grid-secondary {
                gap: 15px;
            }
            .interface-2 .building-card {
                border-radius: 8px;
                border: 2px solid rgba(99,102,241,0.3);
            }
            .interface-2 .building-card::before {
                background: linear-gradient(90deg,#667eea 0%,#764ba2 100%);
            }
            .interface-2 .mini-card-icon {
                border-radius: 8px;
            }
            .interface-2 .stat-card-mini::before {
                background: linear-gradient(90deg,#667eea 0%,transparent 100%);
            }
            .interface-2 .table {
                border-radius: 8px;
                overflow: hidden;
            }
            .interface-2 .action-btn {
                border-radius: 6px;
            }
            .interface-2 .modal-content {
                border-radius: 12px;
            }
            .interface-2 .sidebar {
                border-right: 2px solid rgba(99,102,241,0.2);
            }
        `;
        document.head.appendChild(interfaceStyle);
    }

    // Dashboard Grid Styles
    if (!document.querySelector('#dashboard-grid-styles')) {
        const gridStyle = document.createElement('style');
        gridStyle.id = 'dashboard-grid-styles';
        gridStyle.textContent = `
            .dashboard-grid-secondary {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 40px;
                margin-top: 20px;
            }
            
            .dashboard-buildings {
                margin-top: 10px;
            }
            
            .dashboard-buildings-title {
                font-size: 20px;
                font-weight: 600;
                color: #e0e0e0;
                margin-bottom: 25px;
                padding-bottom: 12px;
                border-bottom: 2px solid rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .dashboard-buildings-title i {
                color: #06d6a0;
                font-size: 22px;
            }
            
            .building-cards-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(2, 1fr);
                gap: 20px;
            }
            
            @media(max-width: 1400px) {
                .dashboard-grid-secondary {
                    grid-template-columns: repeat(2, 1fr);
                }
                .building-cards-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            
            @media(max-width: 768px) {
                .dashboard-grid-secondary {
                    grid-template-columns: 1fr;
                }
                .building-cards-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            .stat-card-mini {
                background: linear-gradient(135deg, #2f3850 0%, #1a1f2e 100%);
                border-radius: 16px;
                padding: 25px;
                border: 1px solid rgba(255,255,255,0.05);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .stat-card-mini::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, var(--accent-color, #4361ee) 0%, transparent 100%);
                opacity: 0.5;
            }
            
            .stat-card-mini:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(70, 90, 202, 0.3);
            }
            
            .mini-card-header {
                margin-bottom: 20px;
            }
            
            .mini-card-name {
                font-size: 16px;
                font-weight: 600;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 6px;
            }
            
            .mini-card-icon {
                width: 42px;
                height: 42px;
                border-radius: 12px;
                background: var(--icon-bg, linear-gradient(135deg, #4361ee 0%, #7209b7 100%));
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                color: white;
                flex-shrink: 0;
            }
            
            .mini-card-stats {
                margin-top: auto;
                text-align: center;
                padding: 15px 10px;
                background: rgba(255,255,255,0.03);
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.05);
            }
            
            .mini-card-value {
                font-size: 42px;
                font-weight: 700;
                margin-bottom: 4px;
                font-family: 'Courier New', monospace;
            }
            
            .mini-card-desc {
                font-size: 12px;
                color: #9e9e9e;
            }
            
            .building-card {
                background: linear-gradient(135deg, #2f3850 0%, #1a1f2e 100%);
                border-radius: 16px;
                padding: 25px;
                border: 1px solid rgba(255,255,255,0.05);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .building-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #4361ee 0%, #7209b7 100%);
            }
            
            .building-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(70, 90, 202, 0.3);
            }
            
            .building-card-header {
                margin-bottom: 20px;
            }
            
            .building-card-name {
                font-size: 16px;
                font-weight: 600;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 6px;
            }
            
            .building-card-location {
                font-size: 13px;
                color: #9e9e9e;
                margin-top: 4px;
                padding-left: 3px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .building-card-stats {
                display: grid;
                grid-template-columns: 1fr;
                gap: 12px;
                margin-top: auto;
            }
            
            .building-stat-item {
                text-align: center;
                padding: 15px 10px;
                background: rgba(255,255,255,0.03);
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.05);
            }
            
            .building-stat-value {
                font-size: 36px;
                font-weight: 700;
                color: #06d6a0;
                font-family: 'Courier New', monospace;
                margin-bottom: 4px;
            }
            
            .building-stat-label {
                font-size: 11px;
                color: #9e9e9e;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 500;
            }
            
            .interface-2 .stat-card-mini {
                border-radius: 12px;
                border: 1px solid rgba(99,102,241,0.15);
                background: linear-gradient(135deg, #1e2440 0%, #161b33 100%);
            }
            
            .interface-2 .stat-card-mini::before {
                background: linear-gradient(90deg, #818cf8 0%, transparent 100%);
            }
            
            .interface-2 .mini-card-icon {
                border-radius: 10px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            }
            
            .interface-2 .building-card {
                border-radius: 12px;
                border: 1px solid rgba(99,102,241,0.15);
                background: linear-gradient(135deg, #1e2440 0%, #161b33 100%);
            }
            
            .interface-2 .building-card::before {
                background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
            }
            
            .interface-2 .building-stat-value {
                color: #818cf8;
            }
        `;
        document.head.appendChild(gridStyle);
    }

    // Sidebar Clickable Styles
    if (!document.querySelector('#sidebar-clickable-styles')) {
        const sidebarStyle = document.createElement('style');
        sidebarStyle.id = 'sidebar-clickable-styles';
        sidebarStyle.textContent = `
            .sidebar {
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .sidebar .nav-item,
            .sidebar button,
            .sidebar a,
            .sidebar input,
            .sidebar select,
            .sidebar textarea {
                cursor: pointer;
            }
            
            .sidebar-header {
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            
            .sidebar-header:hover {
                background-color: rgba(255, 255, 255, 0);
            }
            
            .sidebar-footer {
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            
            .sidebar-footer:hover {
                background-color: rgba(255, 255, 255, 0);
            }
            
            .sidebar-toggle-hint {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0;
                transition: opacity 0.3s ease;
                color: var(--text-secondary);
                font-size: 12px;
            }
            
            .sidebar:hover .sidebar-toggle-hint {
                opacity: 1;
            }
            
            @media (max-width: 768px) {
                .sidebar-toggle-hint {
                    display: none;
                }
            }
        `;
        document.head.appendChild(sidebarStyle);
    }
}

// Inject all styles
injectStyles();

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const AppState = {
    currentUser: null,
    products: [],
    categories: [],
    buildings: [],
    movements: [],
    selectedProductId: null,
    isLoading: false,
    clockInterval: null,
    showArchived: false,
    currentInterface: 'interface1',
    currentSearchTerm: null,
    currentSearchType: null,
    
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0
    },
    
    interfaceStates: {
        interface1: {
            products: [],
            categories: [],
            buildings: [],
            movements: [],
            selectedProductId: null,
            showArchived: false,
            currentSearchTerm: null,
            currentSearchType: null,
            pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
        },
        interface2: {
            products: [],
            categories: [],
            buildings: [],
            movements: [],
            selectedProductId: null,
            showArchived: false,
            currentSearchTerm: null,
            currentSearchType: null,
            pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
        }
    },
    
    // Reset all state
    reset() {
        this.currentUser = null;
        this.products = [];
        this.categories = [];
        this.buildings = [];
        this.movements = [];
        this.selectedProductId = null;
        this.isLoading = false;
        this.showArchived = false;
        this.currentInterface = 'interface1';
        this.currentSearchTerm = null;
        this.currentSearchType = null;
        this.pagination = { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 };
        this.interfaceStates = {
            interface1: {
                products: [], categories: [], buildings: [], movements: [],
                selectedProductId: null, showArchived: false,
                currentSearchTerm: null, currentSearchType: null,
                pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
            },
            interface2: {
                products: [], categories: [], buildings: [], movements: [],
                selectedProductId: null, showArchived: false,
                currentSearchTerm: null, currentSearchType: null,
                pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0, totalPages: 0 }
            }
        };
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    },
    
    // Save current interface state
    saveCurrentState() {
        this.interfaceStates[this.currentInterface] = {
            products: [...this.products],
            categories: [...this.categories],
            buildings: [...this.buildings],
            movements: [...this.movements],
            selectedProductId: this.selectedProductId,
            showArchived: this.showArchived,
            currentSearchTerm: this.currentSearchTerm,
            currentSearchType: this.currentSearchType,
            pagination: { ...this.pagination }
        };
    },
    
    // Load interface state
    loadInterfaceState(interfaceName) {
        const state = this.interfaceStates[interfaceName];
        if (state) {
            this.products = [...state.products];
            this.categories = [...state.categories];
            this.buildings = [...state.buildings];
            this.movements = [...state.movements];
            this.selectedProductId = state.selectedProductId;
            this.showArchived = state.showArchived;
            this.currentSearchTerm = state.currentSearchTerm;
            this.currentSearchType = state.currentSearchType;
            this.pagination = { ...state.pagination };
        }
    },
    
    // Interface label helpers
    getCurrentInterfaceLabel() {
        return DatabaseConfig[this.currentInterface]?.label || 'Unknown';
    },
    
    getCurrentInterfaceShortLabel() {
        return DatabaseConfig[this.currentInterface]?.shortLabel || 'Unknown';
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const Utils = {
    // String utilities
    escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
    
    // Date formatting
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
        } catch {
            return 'Invalid Date';
        }
    },
    
    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-US');
        } catch {
            return 'Invalid Date';
        }
    },
    
    // Performance utilities
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Validation utilities
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    parseInteger(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '') return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    },
    
    parseFloat(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '') return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    },
    
    // ID validation
    validateIdRange(id) {
        const numId = parseInt(id, 10);
        if (isNaN(numId)) {
            return { valid: false, error: 'ID must be a number' };
        }
        if (numId < AppConfig.MIN_ID || numId > AppConfig.MAX_ID) {
            return { valid: false, error: `ID must be between ${AppConfig.MIN_ID} and ${AppConfig.MAX_ID}` };
        }
        return { valid: true, error: null };
    },
    
    validateAndParseId(id) {
        const numId = parseInt(id, 10);
        if (isNaN(numId)) return null;
        if (numId < AppConfig.MIN_ID || numId > AppConfig.MAX_ID) return null;
        return numId;
    },
    
    // Database ID helpers
    async getNextAvailableId(tableName) {
        const supabase = window.getSupabaseClient();
        if (!supabase) return null;
        
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('id')
                .eq('is_active', true)
                .order('id', { ascending: true });
            
            if (error) throw error;
            
            const existingIds = (data || []).map(item => item.id);
            
            for (let i = AppConfig.MIN_ID; i <= AppConfig.MAX_ID; i++) {
                if (!existingIds.includes(i)) return i;
            }
            
            console.error(`No available IDs in range for ${tableName}`);
            return null;
        } catch (error) {
            console.error(`Error in getNextAvailableId:`, error);
            return null;
        }
    },
    
    async isIdAvailable(tableName, id) {
        const supabase = window.getSupabaseClient();
        if (!supabase) return false;
        
        const { data, error } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', id)
            .eq('is_active', true)
            .single();
        
        if (error && error.code === 'PGRST116') return true;
        return false;
    },
    
    // UI notification
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },
    
    // Form validation
    validateForm(formId, rules) {
        const form = document.getElementById(formId);
        if (!form) return { isValid: false, errors: ['Form not found'] };
        
        const errors = [];
        
        for (const [fieldId, rule] of Object.entries(rules)) {
            const element = document.getElementById(fieldId);
            if (!element) continue;
            
            const value = element.value.trim();
            
            if (rule.required && !value) {
                errors.push(rule.message || `${fieldId} is required`);
            }
            if (rule.pattern && value && !rule.pattern.test(value)) {
                errors.push(rule.patternMessage || `${fieldId} is invalid`);
            }
            if (rule.minLength && value && value.length < rule.minLength) {
                errors.push(rule.minLengthMessage || `${fieldId} must be at least ${rule.minLength} characters`);
            }
        }
        
        return { isValid: errors.length === 0, errors };
    },
    
    // Password utilities
    async hashPassword(password) {
        if (typeof bcrypt !== 'undefined') {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        }
        console.warn('bcrypt not available, using plain text (development only)');
        return password;
    },
    
    async verifyPassword(password, hash) {
        if (typeof bcrypt !== 'undefined') {
            return await bcrypt.compare(password, hash);
        }
        return password === hash;
    },
    
    // Condition badge helper
    getConditionBadge(condition) {
        const lowerCondition = (condition || '').toLowerCase();
        let badgeClass = 'working-storage';
        let label = condition || 'Unknown';
        let icon = 'fa-box';
        
        if (lowerCondition.includes('assigned')) {
            badgeClass = 'working-assigned';
            icon = 'fa-user-check';
        } else if (lowerCondition.includes('storage')) {
            badgeClass = 'working-storage';
            icon = 'fa-warehouse';
        } else if (lowerCondition.includes('defective')) {
            badgeClass = 'defective';
            icon = 'fa-exclamation-triangle';
        } else if (lowerCondition.includes('damaged')) {
            badgeClass = 'damaged';
            icon = 'fa-times-circle';
        }
        
        return `<span class="condition-badge ${badgeClass}"><i class="fas ${icon}" aria-hidden="true"></i> ${Utils.escapeHtml(label)}</span>`;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const UIManager = {
    // Loading state
    showLoading() {
        const el = document.getElementById('loading-overlay');
        if (el) {
            el.style.display = 'flex';
            AppState.isLoading = true;
        }
    },
    
    hideLoading() {
        const el = document.getElementById('loading-overlay');
        if (el) {
            el.style.display = 'none';
            AppState.isLoading = false;
        }
    },
    
    // Error handling
    showError(elementId, message, duration = 5000) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        el.textContent = message;
        el.style.display = 'block';
        
        if (duration) {
            setTimeout(() => {
                el.textContent = '';
                el.style.display = 'none';
            }, duration);
        }
        
        console.error('UI Error:', message);
        Utils.showNotification(message, 'error', duration);
    },
    
    hideError(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = '';
            el.style.display = 'none';
        }
    },
    
    // View management
    showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(viewId);
        if (target) target.classList.add('active');
    },
    
    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) target.classList.add('active');
        
        const titleMap = {
            'dashboard-home': 'Dashboard',
            'products-view': 'Assets Management',
            'categories-view': 'Categories Management',
            'buildings-view': 'Buildings Management',
            'stock-view': 'Stock Management',
            'reports-view': 'Reports & Analytics',
            'profile-view': 'User Profile'
        };
        
        const titleEl = document.getElementById('page-title');
        if (titleEl && titleMap[sectionId]) {
            titleEl.textContent = titleMap[sectionId];
        }
    },
    
    // Navigation
    updateNavigation(activeView) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === activeView);
        });
    },
    
    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    // Date/time display
    updateDateTime() {
        const dateEl = document.getElementById('current-date');
        const timeEl = document.getElementById('current-time');
        const now = new Date();
        
        if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
        if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    },
    
    updateDateDisplay() {
        const el = document.getElementById('current-date');
        if (el) el.textContent = new Date().toLocaleDateString('en-US', AppConfig.DATE_FORMAT);
    },
    
    // User interface
    updateUserUI() {
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        
        if (nameEl) nameEl.textContent = AppState.currentUser?.full_name || 'User';
        if (roleEl) roleEl.textContent = AppState.currentUser?.role || 'User';
    },
    
    // Form utilities
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) form.reset();
    },
    
    // Interface indicators
    updateInterfaceIndicator() {
        const indicator = document.getElementById('interface-indicator');
        if (indicator) indicator.textContent = AppState.getCurrentInterfaceShortLabel();
        
        if (AppState.currentInterface === 'interface1') {
            document.body.classList.remove('interface-2');
        } else {
            document.body.classList.add('interface-2');
        }
        
        this.updateDatabaseIndicator();
    },
    
    updateDatabaseIndicator() {
        const dbIndicator = document.getElementById('database-indicator');
        if (dbIndicator) {
            dbIndicator.textContent = `${AppState.getCurrentInterfaceShortLabel()}`;
            dbIndicator.className = `database-indicator ${AppState.currentInterface}`;
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const AuthService = {
    async checkAuth() {
        try {
            const session = localStorage.getItem(AppConfig.SESSION_KEY);
            if (!session) {
                UIManager.showView('login-view');
                return false;
            }
            
            const user = JSON.parse(session);
            const supabase = window.getSupabaseClient();
            if (!supabase) {
                this.logout();
                return false;
            }
            
            const { data, error } = await supabase
                .from(TABLES.USERS)
                .select('id, email, full_name, role, is_active')
                .eq('id', user.id)
                .single();
            
            if (data && !error && data.is_active !== false) {
                AppState.currentUser = data;
                UIManager.updateUserUI();
                UIManager.updateInterfaceIndicator();
                await DataService.loadDashboard();
                UIManager.showView('dashboard-view');
                return true;
            }
            
            this.logout();
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
            return false;
        }
    },
    
    async login(email, password) {
        if (!email || !password) throw new Error('Email and password required');
        
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data, error } = await supabase
            .from(TABLES.USERS)
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();
        
        if (error || !data) throw new Error('Invalid credentials');
        if (!data.is_active) throw new Error('Account is disabled');
        
        const isValidPassword = await Utils.verifyPassword(password, data.password_hash);
        if (!isValidPassword) throw new Error('Invalid credentials');
        
        const session = {
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role
        };
        
        localStorage.setItem(AppConfig.SESSION_KEY, JSON.stringify(session));
        AppState.currentUser = session;
        
        await supabase
            .from(TABLES.USERS)
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);
        
        return data;
    },
    
    async register(fullName, email, password, confirmPassword) {
        if (!fullName || !email || !password) throw new Error('All fields required');
        if (!Utils.isValidEmail(email)) throw new Error('Invalid email format');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < AppConfig.MIN_PASSWORD_LENGTH) {
            throw new Error(`Password must be at least ${AppConfig.MIN_PASSWORD_LENGTH} characters`);
        }
        
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const hashedPassword = await Utils.hashPassword(password);
        
        const { data, error } = await supabase
            .from(TABLES.USERS)
            .insert([{
                email: email.toLowerCase().trim(),
                full_name: fullName.trim(),
                password_hash: hashedPassword,
                role: 'user',
                is_active: true
            }])
            .select()
            .single();
        
        if (error) {
            if (error.code === '23505') throw new Error('Email already exists');
            throw new Error(`Registration failed: ${error.message}`);
        }
        
        return data;
    },
    
    logout() {
        AppState.reset();
        localStorage.removeItem(AppConfig.SESSION_KEY);
        UIManager.clearForm('login-form');
        UIManager.showView('login-view');
        Utils.showNotification('Logged out successfully', 'info');
    },
    
    async changePassword(current, newPassword, confirm) {
        if (!current || !newPassword || !confirm) throw new Error('All fields required');
        if (newPassword !== confirm) throw new Error('New passwords do not match');
        if (newPassword.length < AppConfig.MIN_PASSWORD_LENGTH) {
            throw new Error(`Password must be at least ${AppConfig.MIN_PASSWORD_LENGTH} characters`);
        }
        
        const supabase = window.getSupabaseClient();
        if (!supabase || !AppState.currentUser) throw new Error('Not authenticated');
        
        const { data: user, error: fetchErr } = await supabase
            .from(TABLES.USERS)
            .select('password_hash')
            .eq('id', AppState.currentUser.id)
            .single();
        
        if (fetchErr || !user) throw new Error('User not found');
        
        const isValidCurrent = await Utils.verifyPassword(current, user.password_hash);
        if (!isValidCurrent) throw new Error('Current password is incorrect');
        
        const hashedNew = await Utils.hashPassword(newPassword);
        
        const { error: updateErr } = await supabase
            .from(TABLES.USERS)
            .update({ password_hash: hashedNew })
            .eq('id', AppState.currentUser.id);
        
        if (updateErr) throw new Error('Password update failed');
        
        return true;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

const DataService = {
    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async loadDashboard() {
        try {
            UIManager.showLoading();
            const stats = await this.getDashboardStats();
            await this.renderDashboardStats(stats);
        } catch (error) {
            console.error('Dashboard load failed:', error);
            UIManager.showError('dashboard-error', 'Failed to load dashboard');
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async getDashboardStats() {
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        // Get all active products
        const { data: products, error } = await supabase
            .from(TABLES.PRODUCTS)
            .select(`stock_quantity, condition, category_id, building_id, buildings:building_id(id, name, location_address)`)
            .eq('is_active', true);
        
        if (error) throw error;
        
        // Calculate basic stats
        const totalProducts = products?.length || 0;
        const totalItems = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;
        const defectiveProducts = products?.filter(p => (p.condition || '').toLowerCase().includes('defective')).length || 0;
        const damagedProducts = products?.filter(p => (p.condition || '').toLowerCase().includes('damaged')).length || 0;
        const assignedProducts = products?.filter(p => (p.condition || '').toLowerCase().includes('assigned')).length || 0;
        const workingProducts = totalProducts - defectiveProducts - damagedProducts;
        
        // Get today's movements
        const today = new Date().toISOString().split('T')[0];
        const { data: todayMovements } = await supabase
            .from(TABLES.MOVEMENTS)
            .select('movement_type, quantity')
            .gte('created_at', today);
        
        const todayInbound = todayMovements?.filter(m => m.movement_type === 'IN')
            .reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
        const todayOutbound = todayMovements?.filter(m => m.movement_type === 'OUT')
            .reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
        
        // Get counts
        const { count: categoriesCount } = await supabase
            .from(TABLES.CATEGORIES)
            .select('*', { count: 'exact', head: true });
        
        // Get building stats
        const { data: buildings } = await supabase
            .from(TABLES.BUILDINGS)
            .select('*, products:products(id, stock_quantity)');
        
        // Get category stats with products
        const { data: categories } = await supabase
            .from(TABLES.CATEGORIES)
            .select('*, products:products(id, stock_quantity)')
            .order('id', { ascending: true });
        
        // Group buildings: Voyager (A, B, C combined), Mabini (A, B, C combined)
        const voyagerBuildings = [];
        const mabiniBuildings = [];
        const otherBuildings = [];
        
        (buildings || []).forEach(building => {
            const buildingName = (building.name || '').toLowerCase();
            
            if (buildingName.includes('voyager') && !buildingName.includes('storage')) {
                voyagerBuildings.push(building);
            }
            else if (buildingName.includes('mabini') && !buildingName.includes('storage')) {
                mabiniBuildings.push(building);
            }
            else if (!buildingName.includes('mabini storage')) {
                otherBuildings.push(building);
            }
        });
        
        // Calculate Voyager combined stats
        const voyagerTotalUnits = voyagerBuildings.reduce((sum, building) => {
            const buildingProducts = building.products || [];
            return sum + buildingProducts.reduce((pSum, p) => pSum + (p.stock_quantity || 0), 0);
        }, 0);
        
        // Calculate Mabini combined stats
        const mabiniTotalUnits = mabiniBuildings.reduce((sum, building) => {
            const buildingProducts = building.products || [];
            return sum + buildingProducts.reduce((pSum, p) => pSum + (p.stock_quantity || 0), 0);
        }, 0);
        
        // Create building stats array
        let buildingStats = [];
        
        if (voyagerBuildings.length > 0) {
            buildingStats.push({
                id: 'voyager-combined',
                name: 'Voyager',
                total_units: voyagerTotalUnits,
                product_count: voyagerBuildings.reduce((sum, b) => sum + (b.products || []).length, 0),
            });
        }
        
        if (mabiniBuildings.length > 0) {
            buildingStats.push({
                id: 'mabini-combined',
                name: 'Mabini',
                total_units: mabiniTotalUnits,
                product_count: mabiniBuildings.reduce((sum, b) => sum + (b.products || []).length, 0),
                location: 'Davao City'
            });
        }
        
        otherBuildings.forEach(building => {
            const buildingProducts = building.products || [];
            buildingStats.push({
                id: building.id,
                name: building.name,
                total_units: buildingProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0),
                product_count: buildingProducts.length,
                location: building.location_address || 'N/A'
            });
        });
        
        // Create category stats array
        let categoryStats = [];
        
        (categories || []).forEach(category => {
            const categoryProducts = category.products || [];
            const totalUnits = categoryProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
            
            if (categoryProducts.length > 0) {
                categoryStats.push({
                    id: category.id,
                    name: category.name,
                    total_units: totalUnits,
                    product_count: categoryProducts.length
                });
            }
        });
        
        return {
            total_products: totalProducts,
            total_items: totalItems,
            working_products: workingProducts,
            defective_products: defectiveProducts,
            damaged_products: damagedProducts,
            assigned_products: assignedProducts,
            out_of_stock: products?.filter(p => (p.stock_quantity || 0) === 0).length || 0,
            today_inbound: todayInbound,
            today_outbound: todayOutbound,
            categories_count: categoriesCount || 0,
            buildings_count: buildings?.length || 0,
            building_stats: buildingStats,
            category_stats: categoryStats
        };
    },
    
    async renderDashboardStats(stats) {
        const container = document.getElementById('stats-container');
        if (!container) return;
        
        // Building cards HTML
        const buildingCardsHTML = stats.building_stats.map(building => `
            <div class="building-card">
                <div class="building-card-header">
                    <div class="building-card-name">${Utils.escapeHtml(building.name)}</div>
                    <div class="building-card-location">
                    </div>
                </div>
                <div class="building-card-stats">
                    <div class="building-stat-item">
                        <div class="building-stat-value">${building.total_units.toLocaleString()}</div>
                        <div class="building-stat-label">TOTAL ASSETS</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Category cards HTML
        const categoryCardsHTML = stats.category_stats && stats.category_stats.length > 0 
            ? stats.category_stats.map(category => `
                <div class="building-card">
                    <div class="building-card-header">
                        <div class="building-card-name">${Utils.escapeHtml(category.name)}</div>
                    </div>
                    <div class="building-card-stats">
                        <div class="building-stat-item">
                            <div class="building-stat-value">${category.total_units.toLocaleString()}</div>
                            <div class="building-stat-label">TOTAL ASSETS</div>
                        </div>
                    </div>
                </div>
            `).join('')
            : '';
        
        container.innerHTML = `
            <div class="dashboard-grid-secondary">
                <div class="stat-card-mini" style="--accent-color:#06d6a0;--icon-bg:linear-gradient(135deg,#06d6a0 0%,#1b5e20 100%)">
                    <div class="mini-card-header">
                        <div class="mini-card-name">
                            <div class="mini-card-icon"><i class="fas fa-check-circle"></i></div>
                            Working Products
                        </div>
                    </div>
                    <div class="mini-card-stats">
                        <div class="mini-card-value" style="color:#06d6a0">${stats.working_products}</div>
                        <div class="mini-card-desc">In good condition</div>
                    </div>
                </div>
                
                <div class="stat-card-mini" style="--accent-color:#ff8c00;--icon-bg:linear-gradient(135deg,#ff8c00 0%,#e65100 100%)">
                    <div class="mini-card-header">
                        <div class="mini-card-name">
                            <div class="mini-card-icon"><i class="fas fa-tools"></i></div>
                            Defective
                        </div>
                    </div>
                    <div class="mini-card-stats">
                        <div class="mini-card-value" style="color:#ff8c00">${stats.defective_products}</div>
                        <div class="mini-card-desc">Needs repair/replacement</div>
                    </div>
                </div>
                
                <div class="stat-card-mini" style="--accent-color:#e63946;--icon-bg:linear-gradient(135deg,#e63946 0%,#c62828 100%)">
                    <div class="mini-card-header">
                        <div class="mini-card-name">
                            <div class="mini-card-icon"><i class="fas fa-times-circle"></i></div>
                            Damaged
                        </div>
                    </div>
                    <div class="mini-card-stats">
                        <div class="mini-card-value" style="color:#e63946">${stats.damaged_products}</div>
                        <div class="mini-card-desc">Cannot be used</div>
                    </div>
                </div>
                
                <div class="stat-card-mini" style="--accent-color:#4361ee;--icon-bg:linear-gradient(135deg,#4361ee 0%,#3a0ca3 100%)">
                    <div class="mini-card-header">
                        <div class="mini-card-name">
                            <div class="mini-card-icon"><i class="fas fa-user-check"></i></div>
                            Assigned
                        </div>
                    </div>
                    <div class="mini-card-stats">
                        <div class="mini-card-value" style="color:#4361ee">${stats.assigned_products}</div>
                        <div class="mini-card-desc">Assigned in units</div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-buildings">
                <h3 class="dashboard-buildings-title">
                    <i class="fas fa-building"></i> Building Analysis
                </h3>
                <div class="building-cards-grid">
                    ${buildingCardsHTML}
                </div>
            </div>
            
            ${categoryCardsHTML ? `
            <div class="dashboard-buildings">
                <h3 class="dashboard-buildings-title">
                    <i class="fas fa-tags"></i> Category Analysis
                </h3>
                <div class="building-cards-grid">
                    ${categoryCardsHTML}
                </div>
            </div>
            ` : ''}
        `;
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PAGINATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async getPaginatedProducts(page = 1, itemsPerPage = null) {
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const perPage = itemsPerPage || AppState.pagination.itemsPerPage;
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        
        let query = supabase
            .from(TABLES.PRODUCTS)
            .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
        
        if (!AppState.showArchived) {
            query = query.eq('is_active', true);
        }
        
        const { data, error, count } = await query
            .order('id', { ascending: true })
            .range(from, to);
        
        if (error) throw error;
        
        AppState.pagination.totalItems = count || 0;
        AppState.pagination.totalPages = Math.ceil((count || 0) / perPage);
        AppState.pagination.currentPage = page;
        AppState.pagination.itemsPerPage = perPage;
        
        return {
            products: data || [],
            totalItems: count || 0,
            totalPages: AppState.pagination.totalPages,
            currentPage: page,
            itemsPerPage: perPage
        };
    },
    
    renderPagination() {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        
        const { currentPage, totalPages, totalItems, itemsPerPage } = AppState.pagination;
        
        if (totalItems === 0) {
            paginationContainer.innerHTML = `
                <div class="pagination-wrapper">
                    <div class="pagination-info">No items found</div>
                    <div class="pagination-per-page">
                        <label for="items-per-page">Items per page:</label>
                        <select id="items-per-page" onchange="window.changeItemsPerPage(this.value)">
                            <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                            <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                        </select>
                    </div>
                </div>
            `;
            return;
        }
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = `
                <div class="pagination-wrapper">
                    <div class="pagination-info">Showing all ${totalItems} items</div>
                    <div class="pagination-per-page">
                        <label for="items-per-page">Items per page:</label>
                        <select id="items-per-page" onchange="window.changeItemsPerPage(this.value)">
                            <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                            <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                        </select>
                    </div>
                </div>
            `;
            return;
        }
        
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        let pagesHTML = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page button
        if (startPage > 1) {
            pagesHTML += `<button class="pagination-btn" onclick="window.goToPage(1)" title="Page 1">1</button>`;
            if (startPage > 2) {
                pagesHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pagesHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="window.goToPage(${i})" title="Page ${i}">${i}</button>`;
        }
        
        // Last page button
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagesHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            pagesHTML += `<button class="pagination-btn" onclick="window.goToPage(${totalPages})" title="Page ${totalPages}">${totalPages}</button>`;
        }
        
        paginationContainer.innerHTML = `
            <div class="pagination-wrapper">
                <div class="pagination-info">Showing ${startItem}-${endItem} of ${totalItems} items</div>
                <div class="pagination-controls">
                    <button class="pagination-btn" onclick="window.goToPage(1)" ${currentPage === 1 ? 'disabled' : ''} title="First Page">
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button class="pagination-btn" onclick="window.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} title="Previous Page">
                        <i class="fas fa-angle-left"></i>
                    </button>
                    ${pagesHTML}
                    <button class="pagination-btn" onclick="window.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} title="Next Page">
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button class="pagination-btn" onclick="window.goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''} title="Last Page">
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
                <div class="pagination-per-page">
                    <label for="items-per-page">Items per page:</label>
                    <select id="items-per-page" onchange="window.changeItemsPerPage(this.value)">
                        <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                        <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                    </select>
                </div>
            </div>
        `;
    },
    
    async loadProductsPaginated(page = 1) {
        try {
            UIManager.showLoading();
            const result = await this.getPaginatedProducts(page, AppState.pagination.itemsPerPage);
            AppState.products = result.products;
            this.renderProductsTable(AppState.products);
            this.renderPagination();
        } catch (error) {
            console.error('Products load failed:', error);
            UIManager.showError('products-error', 'Failed to load products');
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async goToPage(page) {
        if (page < 1 || page > AppState.pagination.totalPages) return;
        
        // Check if we're in search mode
        if (AppState.currentSearchTerm) {
            await this.searchProductsPaginated(AppState.currentSearchTerm, page);
        } else {
            await this.loadProductsPaginated(page);
        }
    },
    
    async changeItemsPerPage(value) {
        const itemsPerPage = parseInt(value);
        AppState.pagination.itemsPerPage = itemsPerPage;
        AppState.pagination.currentPage = 1;
        
        // Check if we're in search mode
        if (AppState.currentSearchTerm) {
            await this.searchProductsPaginated(AppState.currentSearchTerm, 1);
        } else {
            await this.loadProductsPaginated(1);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRODUCTS METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async loadProducts() {
        await this.loadProductsPaginated(1);
    },
    
    renderProductsTable(products, highlightedId = null) {
        const tbody = document.getElementById('products-list');
        if (!tbody) return;
        
        if (!products?.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center;padding:30px;color:var(--text-secondary)">
                        <i class="fas fa-box-open" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.5"></i>
                        No products found
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = products.map(p => {
            const isArchived = p.is_active === false;
            const stock = p.stock_quantity || 0;
            const status = stock > 0
                ? '<span class="status-badge status-ok">✓ In Stock</span>'
                : '<span class="status-badge status-low">⚠️ Out of Stock</span>';
            const highlightClass = highlightedId === p.id ? 'highlight-row' : '';
            const archivedClass = isArchived ? 'product-archived' : '';
            const assignedTo = p.assigned_to ? Utils.escapeHtml(p.assigned_to) : '—';
            
            return `
                <tr class="${highlightClass} ${archivedClass}" data-product-id="${p.id}">
                    <td>
                        <strong>${Utils.escapeHtml(String(p.id))}</strong>
                        ${isArchived ? '<span class="archived-badge">Archived</span>' : ''}
                    </td>
                    <td>${Utils.escapeHtml(p.sku || '')}</td>
                    <td>${Utils.escapeHtml(p.name || '')}${isArchived ? ' [DELETED]' : ''}</td>
                    <td>${Utils.escapeHtml(p.categories?.name || 'N/A')}</td>
                    <td>${Utils.escapeHtml(p.buildings?.name || 'N/A')}</td>
                    <td>${assignedTo}</td>
                    <td>${Utils.getConditionBadge(p.condition)}</td>
                    <td>${stock}</td>
                    <td>${status}</td>
                    <td>
                        <button class="action-btn btn-edit" onclick="window.editProduct(${p.id})" ${isArchived ? 'disabled style="opacity:0.5"' : ''}>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="window.deleteProduct(${p.id})">
                            <i class="fas ${isArchived ? 'fa-trash-restore' : 'fa-trash'}"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    async searchProducts(term) {
        try {
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            if (!term?.trim()) {
                AppState.currentSearchTerm = null;
                AppState.currentSearchType = null;
                await this.loadProductsPaginated(1);
                return;
            }
            
            const search = term.trim().toLowerCase();
            
            // Check for category filter: category:CategoryName
            const categoryMatch = search.match(/^category:\s*(.+)$/i);
            if (categoryMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'category';
                await this.filterProductsByCategory(categoryMatch[1].trim());
                return;
            }
            
            // Check for building filter: building:BuildingName
            const buildingMatch = search.match(/^building:\s*(.+)$/i);
            if (buildingMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'building';
                await this.filterProductsByField('building', buildingMatch[1].trim());
                return;
            }
            
            // Check for assigned_to filter: assigned:PersonName
            const assignedMatch = search.match(/^assigned:\s*(.+)$/i);
            if (assignedMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'assigned';
                await this.filterProductsByField('assigned', assignedMatch[1].trim());
                return;
            }
            
            // Check for condition filter: condition:ConditionName
            const conditionMatch = search.match(/^condition:\s*(.+)$/i);
            if (conditionMatch) {
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'condition';
                await this.filterProductsByField('condition', conditionMatch[1].trim());
                return;
            }
            
            const isNumericSearch = /^\d+$/.test(search);
            
            if (isNumericSearch) {
                // Handle exact ID search
                const idNumber = parseInt(search, 10);
                const idValidation = Utils.validateIdRange(idNumber);
                
                if (idValidation.valid) {
                    let query = supabase
                        .from(TABLES.PRODUCTS)
                        .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
                    
                    if (!AppState.showArchived) {
                        query = query.eq('is_active', true);
                    }
                    
                    query = query.eq('id', idNumber);
                    
                    const { data, error, count } = await query;
                    
                    if (error) throw error;
                    
                    AppState.currentSearchTerm = search;
                    AppState.currentSearchType = 'id';
                    AppState.products = data || [];
                    this.renderProductsTable(data || [], idNumber);
                    AppState.pagination.totalItems = count || 0;
                    AppState.pagination.totalPages = Math.ceil((count || 0) / AppState.pagination.itemsPerPage);
                    AppState.pagination.currentPage = 1;
                    this.renderPagination();
                    
                    if (data?.length === 0) {
                        Utils.showNotification(`No product found with ID ${idNumber}`, 'info');
                    } else {
                        Utils.showNotification(`Found product with ID ${idNumber}`, 'success');
                    }
                } else {
                    Utils.showNotification(idValidation.error, 'error');
                    this.renderProductsTable([]);
                    this.renderPagination();
                }
            } else {
                // Store the current search term in AppState for pagination
                AppState.currentSearchTerm = search;
                AppState.currentSearchType = 'general';
                
                // Perform paginated search
                await this.searchProductsPaginated(search, 1);
            }
        } catch (error) {
            console.error('Search failed:', error);
            UIManager.showError('products-error', 'Search failed');
            Utils.showNotification('Search failed: ' + error.message, 'error');
        }
    },
    
    // Paginated search across all fields
    async searchProductsPaginated(searchTerm, page = 1) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const perPage = AppState.pagination.itemsPerPage;
            const from = (page - 1) * perPage;
            const to = from + perPage - 1;
            const searchPattern = `%${searchTerm}%`;
            
            // Collect all matching product IDs from all sources
            let allMatchingIds = new Set();
            
            // Search in main product fields
            let productsQuery = supabase
                .from(TABLES.PRODUCTS)
                .select('id');
            
            if (!AppState.showArchived) {
                productsQuery = productsQuery.eq('is_active', true);
            }
            
            productsQuery = productsQuery.or(
                `name.ilike.${searchPattern},` +
                `sku.ilike.${searchPattern},` +
                `description.ilike.${searchPattern},` +
                `assigned_to.ilike.${searchPattern},` +
                `condition.ilike.${searchPattern}`
            );
            
            const { data: productMatches, error: productError } = await productsQuery;
            
            if (productError) throw productError;
            
            (productMatches || []).forEach(p => allMatchingIds.add(p.id));
            
            // Search in categories
            const { data: matchingCategories } = await supabase
                .from(TABLES.CATEGORIES)
                .select('id')
                .ilike('name', searchPattern);
            
            const categoryIds = (matchingCategories || []).map(c => c.id);
            
            if (categoryIds.length > 0) {
                let categoryProductsQuery = supabase
                    .from(TABLES.PRODUCTS)
                    .select('id');
                
                if (!AppState.showArchived) {
                    categoryProductsQuery = categoryProductsQuery.eq('is_active', true);
                }
                
                categoryProductsQuery = categoryProductsQuery.in('category_id', categoryIds);
                
                const { data: categoryProductMatches } = await categoryProductsQuery;
                (categoryProductMatches || []).forEach(p => allMatchingIds.add(p.id));
            }
            
            // Search in buildings
            const { data: matchingBuildings } = await supabase
                .from(TABLES.BUILDINGS)
                .select('id')
                .ilike('name', searchPattern);
            
            const buildingIds = (matchingBuildings || []).map(b => b.id);
            
            if (buildingIds.length > 0) {
                let buildingProductsQuery = supabase
                    .from(TABLES.PRODUCTS)
                    .select('id');
                
                if (!AppState.showArchived) {
                    buildingProductsQuery = buildingProductsQuery.eq('is_active', true);
                }
                
                buildingProductsQuery = buildingProductsQuery.in('building_id', buildingIds);
                
                const { data: buildingProductMatches } = await buildingProductsQuery;
                (buildingProductMatches || []).forEach(p => allMatchingIds.add(p.id));
            }
            
            const matchingIdArray = Array.from(allMatchingIds).sort((a, b) => a - b);
            const totalItems = matchingIdArray.length;
            const totalPages = Math.ceil(totalItems / perPage);
            
            // Get the IDs for the current page
            const pageIds = matchingIdArray.slice(from, to + 1);
            
            // Fetch full product data for the current page
            let finalQuery = supabase
                .from(TABLES.PRODUCTS)
                .select(`*, categories:category_id(name), buildings:building_id(name)`)
                .in('id', pageIds)
                .order('id', { ascending: true });
            
            const { data: paginatedProducts, error: finalError } = await finalQuery;
            
            if (finalError) throw finalError;
            
            // Sort results to match the order of pageIds
            const sortedProducts = pageIds.map(id => 
                (paginatedProducts || []).find(p => p.id === id)
            ).filter(Boolean);
            
            // Update state
            AppState.products = sortedProducts;
            AppState.pagination.totalItems = totalItems;
            AppState.pagination.totalPages = totalPages;
            AppState.pagination.currentPage = page;
            AppState.pagination.itemsPerPage = perPage;
            
            this.renderProductsTable(sortedProducts);
            this.renderPagination();
            
            if (sortedProducts.length === 0) {
                Utils.showNotification('No products found matching your search', 'info');
            } else if (page === 1) {
                Utils.showNotification(`Found ${totalItems} product(s) matching "${searchTerm}"`, 'success');
            }
            
        } catch (error) {
            console.error('Paginated search failed:', error);
            throw error;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    // Filter products by field
    async filterProductsByField(field, value) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            let query = supabase
                .from(TABLES.PRODUCTS)
                .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
            
            if (!AppState.showArchived) {
                query = query.eq('is_active', true);
            }
            
            const fieldLabels = {
                'building': 'Building',
                'assigned': 'Assigned To',
                'condition': 'Condition'
            };
            
            switch (field) {
                case 'building':
                    query = query.filter('buildings.name', 'ilike', `%${value}%`);
                    break;
                    
                case 'assigned':
                    query = query.ilike('assigned_to', `%${value}%`);
                    break;
                    
                case 'condition':
                    query = query.ilike('condition', `%${value}%`);
                    break;
                    
                default:
                    throw new Error(`Unknown filter type: ${field}`);
            }
            
            const { data, error, count } = await query.order('id', { ascending: true });
            
            if (error) throw error;
            
            AppState.products = data || [];
            this.renderProductsTable(data || []);
            AppState.pagination.totalItems = count || 0;
            AppState.pagination.totalPages = Math.ceil((count || 0) / AppState.pagination.itemsPerPage);
            AppState.pagination.currentPage = 1;
            this.renderPagination();
            
            const fieldLabel = fieldLabels[field] || field;
            
            if (!data || data.length === 0) {
                Utils.showNotification(`No products found with ${fieldLabel.toLowerCase()} matching "${value}"`, 'info');
            } else {
                Utils.showNotification(`Found ${data.length} product(s) with ${fieldLabel.toLowerCase()} matching "${value}"`, 'success');
            }
        } catch (error) {
            console.error(`${field} filter failed:`, error);
            Utils.showNotification(`Filter failed: ${error.message}`, 'error');
            this.renderProductsTable([]);
            this.renderPagination();
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async filterProductsByCategory(categoryName) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            let query = supabase
                .from(TABLES.PRODUCTS)
                .select(`*, categories:category_id(name), buildings:building_id(name)`, { count: 'exact' });
            
            if (!AppState.showArchived) {
                query = query.eq('is_active', true);
            }
            
            query = query.filter('categories.name', 'ilike', `%${categoryName}%`);
            
            const { data, error, count } = await query.order('id', { ascending: true });
            
            if (error) throw error;
            
            AppState.products = data || [];
            this.renderProductsTable(data || []);
            AppState.pagination.totalItems = count || 0;
            AppState.pagination.totalPages = Math.ceil((count || 0) / AppState.pagination.itemsPerPage);
            AppState.pagination.currentPage = 1;
            this.renderPagination();
            
            if (data?.length === 0) {
                Utils.showNotification(`No products found in category matching "${categoryName}"`, 'info');
            } else {
                Utils.showNotification(`Found ${data.length} product(s) in category matching "${categoryName}"`, 'success');
            }
        } catch (error) {
            console.error('Category filter failed:', error);
            Utils.showNotification('Category filter failed: ' + error.message, 'error');
            this.renderProductsTable([]);
            this.renderPagination();
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async saveProduct(data, id = null) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            if (!data.condition) {
                data.condition = PRODUCT_CONDITIONS.DEFAULT;
            }
            
            if (id) {
                // Update existing product
                const idValidation = Utils.validateIdRange(id);
                if (!idValidation.valid) throw new Error(idValidation.error);
                
                const { data: oldProduct } = await supabase
                    .from(TABLES.PRODUCTS)
                    .select('stock_quantity, is_active')
                    .eq('id', id)
                    .single();
                
                if (oldProduct && oldProduct.is_active === false) {
                    throw new Error('Cannot edit archived product. Please restore it first.');
                }
                
                const { error } = await supabase
                    .from(TABLES.PRODUCTS)
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', id);
                
                if (error) throw error;
                
                // Record stock change if quantity changed
                if (oldProduct && oldProduct.stock_quantity !== data.stock_quantity) {
                    const diff = data.stock_quantity - oldProduct.stock_quantity;
                    if (diff !== 0) {
                        await supabase.from(TABLES.MOVEMENTS).insert([{
                            product_id: id,
                            quantity: Math.abs(diff),
                            movement_type: diff > 0 ? 'IN' : 'OUT',
                            reference: 'STOCK_ADJUSTMENT',
                            notes: `Adjusted via edit: ${oldProduct.stock_quantity} → ${data.stock_quantity}`,
                            user_id: AppState.currentUser?.id,
                            created_at: new Date().toISOString()
                        }]);
                    }
                }
            } else {
                // Create new product
                const nextId = await Utils.getNextAvailableId(TABLES.PRODUCTS);
                if (!nextId) {
                    throw new Error(`No available IDs in range ${AppConfig.MIN_ID}-${AppConfig.MAX_ID}. Maximum capacity reached.`);
                }
                
                const { error } = await supabase.from(TABLES.PRODUCTS).insert([{
                    id: nextId,
                    ...data,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
                if (error) throw error;
                
                // Record initial stock movement
                if (data.stock_quantity > 0) {
                    await supabase.from(TABLES.MOVEMENTS).insert([{
                        product_id: nextId,
                        quantity: data.stock_quantity,
                        movement_type: 'IN',
                        reference: 'INITIAL_STOCK',
                        notes: 'Created with initial stock',
                        user_id: AppState.currentUser?.id,
                        created_at: new Date().toISOString()
                    }]);
                }
            }
            
            // Reload products based on current state
            if (AppState.currentSearchTerm) {
                await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
            } else {
                await this.loadProductsPaginated(AppState.pagination.currentPage);
            }
            
            Utils.showNotification(`Product ${id ? 'updated' : 'created'} successfully`, 'success');
            return true;
        } catch (error) {
            console.error('Product save failed:', error);
            throw error;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async deleteProduct(id) {
        try {
            const idValidation = Utils.validateIdRange(id);
            if (!idValidation.valid) throw new Error(idValidation.error);
            
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { data: product, error: productErr } = await supabase
                .from(TABLES.PRODUCTS)
                .select('is_active, name')
                .eq('id', id)
                .single();
            
            if (productErr) throw productErr;
            
            // If already archived, offer permanent deletion
            if (product.is_active === false) {
                if (confirm(`Permanently delete "${product.name}"? This will remove all movement history. This action cannot be undone.`)) {
                    const { data: movements, error: moveCheck } = await supabase
                        .from(TABLES.MOVEMENTS)
                        .select('id')
                        .eq('product_id', id);
                    
                    if (moveCheck) throw moveCheck;
                    
                    if (movements?.length > 0) {
                        const { error: deleteMovements } = await supabase
                            .from(TABLES.MOVEMENTS)
                            .delete()
                            .eq('product_id', id);
                        
                        if (deleteMovements) throw deleteMovements;
                    }
                    
                    const { error } = await supabase
                        .from(TABLES.PRODUCTS)
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    Utils.showNotification('Product permanently deleted', 'success');
                    if (AppState.currentSearchTerm) {
                        await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
                    } else {
                        await this.loadProductsPaginated(AppState.pagination.currentPage);
                    }
                }
                return true;
            }
            
            // Check for movements
            const { data: movements, error: moveCheck } = await supabase
                .from(TABLES.MOVEMENTS)
                .select('id', { count: 'exact' })
                .eq('product_id', id);
            
            if (moveCheck) throw moveCheck;
            
            if (movements?.length > 0) {
                if (confirm(`Product "${product.name}" has ${movements.length} movement record(s).\n\nIt cannot be deleted due to existing history.\n\nWould you like to ARCHIVE it instead?\n(Archived products are hidden from main view but can be restored later)`)) {
                    const { error } = await supabase
                        .from(TABLES.PRODUCTS)
                        .update({ is_active: false, deleted_at: new Date().toISOString() })
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    Utils.showNotification('Product archived successfully', 'warning');
                    if (AppState.currentSearchTerm) {
                        await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
                    } else {
                        await this.loadProductsPaginated(AppState.pagination.currentPage);
                    }
                }
            } else {
                if (confirm(`Delete product "${product.name}"? This action cannot be undone.`)) {
                    const { error } = await supabase
                        .from(TABLES.PRODUCTS)
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;
                    
                    Utils.showNotification('Product deleted successfully', 'success');
                    if (AppState.currentSearchTerm) {
                        await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
                    } else {
                        await this.loadProductsPaginated(AppState.pagination.currentPage);
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Product delete failed:', error);
            Utils.showNotification(error.message, 'error');
            return false;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async restoreProduct(id) {
        try {
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { error } = await supabase
                .from(TABLES.PRODUCTS)
                .update({ is_active: true, deleted_at: null })
                .eq('id', id);
            
            if (error) throw error;
            
            Utils.showNotification('Product restored successfully', 'success');
            if (AppState.currentSearchTerm) {
                await this.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage);
            } else {
                await this.loadProductsPaginated(AppState.pagination.currentPage);
            }
            return true;
        } catch (error) {
            console.error('Product restore failed:', error);
            Utils.showNotification(error.message, 'error');
            return false;
        }
    },
    
    async toggleShowArchived() {
        AppState.showArchived = !AppState.showArchived;
        const btn = document.getElementById('toggle-archived');
        if (btn) btn.textContent = AppState.showArchived ? 'Hide Archived' : 'Show Archived';
        
        if (AppState.currentSearchTerm) {
            await this.searchProductsPaginated(AppState.currentSearchTerm, 1);
        } else {
            await this.loadProductsPaginated(1);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CATEGORIES METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async loadCategories() {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { data, error } = await supabase
                .from(TABLES.CATEGORIES)
                .select('*')
                .order('id', { ascending: true });
            
            if (error) throw error;
            
            AppState.categories = data || [];
            this.renderCategoriesTable(AppState.categories);
        } catch (error) {
            console.error('Categories load failed:', error);
            UIManager.showError('categories-error', 'Failed to load categories');
        } finally {
            UIManager.hideLoading();
        }
    },
    
    renderCategoriesTable(categories) {
        const tbody = document.getElementById('categories-list');
        if (!tbody) return;
        
        if (!categories?.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No categories</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map(c => `
            <tr>
                <td><strong>${Utils.escapeHtml(String(c.id))}</strong></td>
                <td>${Utils.escapeHtml(c.name)}</td>
                <td>${Utils.escapeHtml(c.description || '')}</td>
                <td>${Utils.formatDate(c.created_at)}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="window.editCategory(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="window.deleteCategory(${c.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    async saveCategory(data, id = null) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            if (!id) {
                const nextId = await Utils.getNextAvailableId(TABLES.CATEGORIES);
                if (!nextId) throw new Error('No available IDs. Maximum capacity reached.');
                
                const { error } = await supabase.from(TABLES.CATEGORIES).insert([{
                    id: nextId,
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(TABLES.CATEGORIES)
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', id);
                
                if (error) throw error;
            }
            
            await this.loadCategories();
            Utils.showNotification(`Category ${id ? 'updated' : 'created'} successfully`, 'success');
            return true;
        } catch (error) {
            console.error('Category save failed:', error);
            throw error;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async deleteCategory(id) {
        try {
            if (!confirm('Delete this category? Products in this category will be affected.')) {
                return false;
            }
            
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { data: used, error: checkErr } = await supabase
                .from(TABLES.PRODUCTS)
                .select('id')
                .eq('category_id', id)
                .limit(1);
            
            if (checkErr) throw checkErr;
            if (used?.length > 0) throw new Error('Category is being used by products and cannot be deleted');
            
            const { error } = await supabase
                .from(TABLES.CATEGORIES)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            await this.loadCategories();
            Utils.showNotification('Category deleted successfully', 'success');
            return true;
        } catch (error) {
            console.error('Category delete failed:', error);
            Utils.showNotification(error.message, 'error');
            return false;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // BUILDINGS METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async loadBuildings() {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { data, error } = await supabase
                .from(TABLES.BUILDINGS)
                .select('*')
                .order('id', { ascending: true });
            
            if (error) throw error;
            
            AppState.buildings = data || [];
            this.renderBuildingsTable(AppState.buildings);
        } catch (error) {
            console.error('Buildings load failed:', error);
            UIManager.showError('buildings-error', 'Failed to load buildings');
        } finally {
            UIManager.hideLoading();
        }
    },
    
    renderBuildingsTable(buildings) {
        const tbody = document.getElementById('buildings-list');
        if (!tbody) return;
        
        if (!buildings?.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No buildings</td></tr>';
            return;
        }
        
        tbody.innerHTML = buildings.map(b => `
            <tr>
                <td><strong>${Utils.escapeHtml(String(b.id))}</strong></td>
                <td>${Utils.escapeHtml(b.name)}</td>
                <td>${Utils.escapeHtml(b.location_address || '')}</td>
                <td>${Utils.formatDate(b.created_at)}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="window.editBuilding(${b.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="window.deleteBuilding(${b.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    async saveBuilding(data, id = null) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            if (!id) {
                const nextId = await Utils.getNextAvailableId(TABLES.BUILDINGS);
                if (!nextId) throw new Error('No available IDs. Maximum capacity reached.');
                
                const { error } = await supabase.from(TABLES.BUILDINGS).insert([{
                    id: nextId,
                    ...data,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(TABLES.BUILDINGS)
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', id);
                
                if (error) throw error;
            }
            
            await this.loadBuildings();
            Utils.showNotification(`Building ${id ? 'updated' : 'created'} successfully`, 'success');
            return true;
        } catch (error) {
            console.error('Building save failed:', error);
            throw error;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async deleteBuilding(id) {
        try {
            if (!confirm('Delete this building? Products in this building will be affected.')) {
                return false;
            }
            
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const { data: used, error: checkErr } = await supabase
                .from(TABLES.PRODUCTS)
                .select('id')
                .eq('building_id', id)
                .limit(1);
            
            if (checkErr) throw checkErr;
            if (used?.length > 0) throw new Error('Building is being used by products and cannot be deleted');
            
            const { error } = await supabase
                .from(TABLES.BUILDINGS)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            await this.loadBuildings();
            Utils.showNotification('Building deleted successfully', 'success');
            return true;
        } catch (error) {
            console.error('Building delete failed:', error);
            Utils.showNotification(error.message, 'error');
            return false;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // STOCK MANAGEMENT METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    // Add this method to the DataService object (around line 1500-1600 area)

async loadStockView() {
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data, error } = await supabase
            .from(TABLES.PRODUCTS)
            .select('id, name, sku, stock_quantity, condition')
            .eq('is_active', true)
            .ilike('condition', '%defective%')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        AppState.products = data || [];
        this.populateProductSelect(AppState.products);
        await this.loadAllMovements();
    } catch (error) {
        console.error('Stock view load failed:', error);
        UIManager.showError('stock-error', 'Failed to load stock view');
    } finally {
        UIManager.hideLoading();
    }
},

// Update the populateProductSelect method in DataService
populateProductSelect(products) {
    const select = document.getElementById('stock-product');
    if (!select) return;
    
    if (!products || products.length === 0) {
        select.innerHTML = '<option value="">No defective products found</option>';
        return;
    }
    
    select.innerHTML = '<option value="">Select defective product...</option>' +
        products.map(p => `
            <option value="${p.id}" data-sku="${Utils.escapeHtml(p.sku || '')}" data-name="${Utils.escapeHtml(p.name)}">
                ID ${p.id}: ${Utils.escapeHtml(p.name)} (Stock: ${p.stock_quantity || 0})
                ${(p.stock_quantity || 0) === 0 ? ' ⚠️ Out of Stock' : ''}
            </option>
        `).join('');
},

// Update the handleProductSelect method in App object
handleProductSelect() {
    const select = document.getElementById('stock-product');
    const id = select?.value;
    
    if (!id) {
        const info = document.getElementById('stock-info');
        if (info) info.style.display = 'none';
        AppState.selectedProductId = null;
        
        // Clear the code field when no product selected
        const codeField = document.getElementById('stock-code');
        if (codeField) {
            codeField.value = '';
            codeField.style.backgroundColor = '';
        }
        return;
    }
    
    AppState.selectedProductId = parseInt(id);
    
    // Get the selected option element to fetch data attributes
    const selectedOption = select.options[select.selectedIndex];
    const sku = selectedOption?.getAttribute('data-sku') || '';
    const productName = selectedOption?.getAttribute('data-name') || '';
    
    const product = AppState.products.find(p => p.id === AppState.selectedProductId);
    
    if (product) {
        const info = document.getElementById('stock-info');
        const current = document.getElementById('current-stock');
        const warning = document.getElementById('stock-warning');
        const codeField = document.getElementById('stock-code');
        
        if (info) info.style.display = 'block';
        if (current) current.textContent = `Current Stock: ${product.stock_quantity || 0}`;
        
        // Auto-fill the code field with the product's SKU
        if (codeField) {
            // Use SKU if available, otherwise create a formatted code
            if (sku) {
                codeField.value = sku;
            } else {
                // Generate a code based on product ID and name
                const namePrefix = productName.substring(0, 3).toUpperCase();
                codeField.value = `${namePrefix}-${product.id}`;
            }
            
            // Add a visual indicator that it was auto-filled
            codeField.style.backgroundColor = '#e8f0fe';
            setTimeout(() => {
                if (codeField) codeField.style.backgroundColor = '';
            }, 500);
        }
        
        const active = document.querySelector('.btn-type.active');
        if (active?.dataset.type === 'OUT' && warning) {
            warning.textContent = `⚠️ Available: ${product.stock_quantity || 0} units`;
            warning.style.display = 'block';
        } else if (warning) {
            warning.textContent = '';
            warning.style.display = 'none';
        }
    }
},

// Update clearStockForm method in App object
clearStockForm() {
    const form = document.getElementById('stock-form');
    if (form) form.reset();
    
    const info = document.getElementById('stock-info');
    if (info) info.style.display = 'none';
    
    const warning = document.getElementById('stock-warning');
    if (warning) warning.textContent = '';
    
    // Clear the code field explicitly
    const codeField = document.getElementById('stock-code');
    if (codeField) {
        codeField.value = '';
        codeField.style.backgroundColor = '';
    }
    
    AppState.selectedProductId = null;
    
    const select = document.getElementById('stock-product');
    if (select) select.value = '';
    
    // Reset the button states (set IN as active by default)
    const inBtn = document.querySelector('.btn-type[data-type="IN"]');
    const outBtn = document.querySelector('.btn-type[data-type="OUT"]');
    if (inBtn) inBtn.classList.add('active');
    if (outBtn) outBtn.classList.remove('active');
},

// Update loadStockView method to ensure SKU is included
async loadStockView() {                                                                             
    try {
        UIManager.showLoading();
        const supabase = window.getSupabaseClient();
        if (!supabase) throw new Error('Database unavailable');
        
        const { data, error } = await supabase                                                                                                        
            .from(TABLES.PRODUCTS)
            .select('id, name, sku, stock_quantity, condition')
            .eq('is_active', true)
            .ilike('condition', '%defective%')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        AppState.products = data || [];
        this.populateProductSelect(AppState.products);
        await this.loadAllMovements();
    } catch (error) {
        console.error('Stock view load failed:', error);
        UIManager.showError('stock-error', 'Failed to load stock view');
    } finally {
        UIManager.hideLoading();
    }
},
    
    async loadAllMovements() {
        try {
            const supabase = window.getSupabaseClient();
            if (!supabase) return;
            
            const { data, error } = await supabase
                .from(TABLES.MOVEMENTS)
                .select('*, products:product_id(name)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            AppState.movements = data || [];
            this.renderMovementsTable(AppState.movements);
        } catch (error) {
            console.error('Movements load failed:', error);
        }
    },
    
    renderMovementsTable(movements) {
        const tbody = document.getElementById('movements-list');
        if (!tbody) return;
        
        if (!movements?.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No movements</td></tr>';
            return;
        }
        
        tbody.innerHTML = movements.map(m => `
            <tr>
                <td>${Utils.formatDateTime(m.created_at)}</td>
                <td>${Utils.escapeHtml(m.products?.name || 'Unknown')}</td>
                <td><span class="movement-type ${m.movement_type === 'IN' ? 'in' : 'out'}">${m.movement_type}</span></td>
                <td>${m.quantity}</td>
                <td>${Utils.escapeHtml(m.reference || '')}</td>
                <td>${Utils.escapeHtml(m.notes || '')}</td>
            </tr>
        `).join('');
    },
    
    async loadCategoriesSelect() {
        try {
            const supabase = window.getSupabaseClient();
            if (!supabase) return;
            
            const { data, error } = await supabase
                .from(TABLES.CATEGORIES)
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            
            const select = document.getElementById('product-category');
            if (!select) return;
            
            select.innerHTML = '<option value="">Select Category...</option>' +
                (data || []).map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('');
        } catch (error) {
            console.error('Categories select load failed:', error);
        }
    },
    
    async loadBuildingsSelect() {
        try {
            const supabase = window.getSupabaseClient();
            if (!supabase) return;
            
            const { data, error } = await supabase
                .from(TABLES.BUILDINGS)
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            
            const select = document.getElementById('product-building');
            if (!select) return;
            
            select.innerHTML = '<option value="">Select Building...</option>' +
                (data || []).map(b => `<option value="${b.id}">${Utils.escapeHtml(b.name)}</option>`).join('');
        } catch (error) {
            console.error('Buildings select load failed:', error);
        }
    },
    
    async adjustStock(productId, quantity, type, reference = null, notes = null) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const product = AppState.products.find(p => p.id === productId);
            if (!product) throw new Error('Product not found');
            
            if (type === 'OUT' && (product.stock_quantity || 0) < quantity) {
                throw new Error(`Insufficient stock. Available: ${product.stock_quantity || 0}`);
            }
            
            const newQty = type === 'IN'
                ? (product.stock_quantity || 0) + quantity
                : (product.stock_quantity || 0) - quantity;
            
            const { error: updateErr } = await supabase
                .from(TABLES.PRODUCTS)
                .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
                .eq('id', productId);
            
            if (updateErr) throw updateErr;
            
            const { error: moveErr } = await supabase.from(TABLES.MOVEMENTS).insert([{
                product_id: productId,
                quantity,
                movement_type: type,
                reference: reference || null,
                notes: notes || null,
                user_id: AppState.currentUser?.id,
                created_at: new Date().toISOString()
            }]);
            
            if (moveErr) throw moveErr;
            
            product.stock_quantity = newQty;
            
            await Promise.all([this.loadAllMovements(), this.loadDashboard()]);
            Utils.showNotification(`Stock adjusted: ${type} ${quantity} units`, 'success');
            return true;
        } catch (error) {
            console.error('Stock adjust failed:', error);
            throw error;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // REPORTS METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    async generateReport(type) {
        try {
            UIManager.showLoading();
            const supabase = window.getSupabaseClient();
            if (!supabase) throw new Error('Database unavailable');
            
            const content = document.getElementById('report-content');
            if (!content) return;
            
            switch (type) {
                case 'stock-summary':
                    await this.showStockSummary(content);
                    break;
                case 'category-analysis':
                    await this.showCategoryAnalysis(content);
                    break;
                case 'building-analysis':
                    await this.showBuildingAnalysis(content);
                    break;
                case 'movement-history':
                    await this.showMovementHistory(content);
                    break;
                default:
                    throw new Error('Unknown report type');
            }
        } catch (error) {
            console.error('Report generation failed:', error);
            const content = document.getElementById('report-content');
            if (content) {
                content.innerHTML = `<p style="color:var(--danger);text-align:center;padding:20px">Report generation failed: ${error.message}</p>`;
            }
            throw error;
        } finally {
            UIManager.hideLoading();
        }
    },
    
    async showStockSummary(container) {
        const supabase = window.getSupabaseClient();
        const stats = await this.getDashboardStats();
        const { data: products } = await supabase
            .from(TABLES.PRODUCTS)
            .select(`*, categories:category_id(name), buildings:building_id(name)`)
            .eq('is_active', true)
            .order('id', { ascending: true });
        
        let html = `
            <div class="stats-grid" style="margin-bottom:20px">
                <div class="stat-card">
                    <div class="stat-value">${stats.total_items}</div>
                    <div class="stat-title">Total Items</div>
                </div>
            </div>
            <div class="table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Code</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Building</th>
                            <th>Condition</th>
                            <th>Stock</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        (products || []).forEach(p => {
            const stock = p.stock_quantity || 0;
            const status = stock > 0 ? 'OK' : 'OUT OF STOCK';
            html += `
                <tr>
                    <td>${p.id}</td>
                    <td>${Utils.escapeHtml(p.sku || '-')}</td>
                    <td><strong>${Utils.escapeHtml(p.name)}</strong></td>
                    <td>${Utils.escapeHtml(p.categories?.name || 'N/A')}</td>
                    <td>${Utils.escapeHtml(p.buildings?.name || 'N/A')}</td>
                    <td>${Utils.getConditionBadge(p.condition)}</td>
                    <td style="color:${status === 'OUT OF STOCK' ? '#ef476f' : '#06d6a0'}">${stock}</td>
                    <td><span class="status-badge status-${status === 'OUT OF STOCK' ? 'low' : 'ok'}">${status}</span></td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    },
    
    async showCategoryAnalysis(container) {
        const supabase = window.getSupabaseClient();
        const { data: categories } = await supabase
            .from(TABLES.CATEGORIES)
            .select('*, products:products(id, stock_quantity)')
            .gte('id', 1)
            .order('id', { ascending: true });
        
        let html = `
            <div class="table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Category</th>
                            <th>Assets</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let grandTotal = 0;
        (categories || []).forEach(c => {
            const products = c.products || [];
            const totalUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
            grandTotal += totalUnits;
            
            html += `
                <tr>
                    <td>${c.id}</td>
                    <td><strong>${Utils.escapeHtml(c.name)}</strong></td>
                    <td>${totalUnits}</td>
                </tr>
            `;
        });
        
        html += `
                <tr style="background:linear-gradient(135deg,#2f3850 0%,#1a1f2e 100%);font-weight:bold;border-top:2px solid #4361ee">
                    <td colspan="2" style="text-align:right;color:#e0e0e0">TOTAL ASSETS:</td>
                    <td style="color:#06d6a0;font-size:16px">${grandTotal}</td>
                </tr>
            </tbody></table></div>
        `;
        
        container.innerHTML = html;
    },
    
    async showBuildingAnalysis(container) {
        const supabase = window.getSupabaseClient();
        const { data: buildings } = await supabase
            .from(TABLES.BUILDINGS)
            .select(`*, products:products(id, name, stock_quantity, category_id, categories:category_id(name))`)
            .order('id', { ascending: true });
        
        let html = `
            <div class="table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Building</th>
                            <th>PC-Desktop Units</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let grandTotal = 0;
        (buildings || []).forEach(b => {
            const products = b.products || [];
            const pcDesktopProducts = products.filter(p =>
                p.categories && (p.categories.name || '').toLowerCase().includes('pc-desktop')
            );
            const totalUnits = pcDesktopProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
            grandTotal += totalUnits;
            
            html += `
                <tr>
                    <td>${b.id}</td>
                    <td><strong>${Utils.escapeHtml(b.name)}</strong></td>
                    <td>${totalUnits}</td>
                </tr>
            `;
        });
        
        html += `
                <tr style="background:linear-gradient(135deg,#2f3850 0%,#1a1f2e 100%);font-weight:bold;border-top:2px solid #4361ee">
                    <td colspan="2" style="text-align:right;color:#e0e0e0">TOTAL PC-DESKTOP UNITS:</td>
                    <td style="color:#06d6a0;font-size:16px">${grandTotal}</td>
                </tr>
            </tbody></table></div>
        `;
        
        container.innerHTML = html;
    },
    
    async showMovementHistory(container) {
        const supabase = window.getSupabaseClient();
        const { data } = await supabase
            .from(TABLES.MOVEMENTS)
            .select('*, products:product_id(name)')
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (!data?.length) {
            container.innerHTML = '<p style="text-align:center;padding:40px">No movements found</p>';
            return;
        }
        
        let html = `
            <div class="table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Type</th>
                            <th>Qty</th>
                            <th>Reference</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach(m => {
            html += `
                <tr>
                    <td>${Utils.formatDateTime(m.created_at)}</td>
                    <td>${Utils.escapeHtml(m.products?.name || 'Unknown')}</td>
                    <td><span class="movement-type ${m.movement_type === 'IN' ? 'in' : 'out'}">${m.movement_type}</span></td>
                    <td>${m.quantity}</td>
                    <td>${Utils.escapeHtml(m.reference || '-')}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

const App = {
    interfaceToggleBtn: null,
    
    async init() {
        try {
            console.log('App initializing...');
            
            const initialized = SupabaseManager.initializeClients();
            if (!initialized) {
                console.error('Supabase init failed');
                UIManager.showError('app-error', 'Database connection failed. Please refresh the page.');
                return;
            }
            
            UIManager.updateDateTime();
            AppState.clockInterval = setInterval(() => UIManager.updateDateTime(), 1000);
            
            await AuthService.checkAuth();
            this.bindEvents();
            this.setupMobileMenu();
            this.setupInterfaceToggle();
            this.addInterfaceToggleButton();
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Init failed:', error);
            UIManager.showError('app-error', 'Application failed to start');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENT BINDING
    // ═══════════════════════════════════════════════════════════════════════
    
    bindEvents() {
        // Authentication
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async e => {
                e.preventDefault();
                try {
                    UIManager.showLoading();
                    UIManager.hideError('login-error');
                    
                    await AuthService.login(
                        document.getElementById('username')?.value,
                        document.getElementById('password')?.value
                    );
                    
                    UIManager.updateUserUI();
                    UIManager.updateInterfaceIndicator();
                    await DataService.loadDashboard();
                    UIManager.showView('dashboard-view');
                    Utils.showNotification('Login successful!', 'success');
                } catch (err) {
                    UIManager.showError('login-error', err.message || 'Login failed');
                } finally {
                    UIManager.hideLoading();
                    if (loginForm) loginForm.reset();
                }
            });
        }
        
        // Registration
        const regForm = document.getElementById('register-form');
        if (regForm) {
            regForm.addEventListener('submit', async e => {
                e.preventDefault();
                try {
                    UIManager.showLoading();
                    UIManager.hideError('register-error');
                    
                    await AuthService.register(
                        document.getElementById('reg-fullname')?.value,
                        document.getElementById('reg-email')?.value,
                        document.getElementById('reg-password')?.value,
                        document.getElementById('reg-confirm-password')?.value
                    );
                    
                    Utils.showNotification('Registration successful! Please login.', 'success');
                    UIManager.closeModal('register-modal');
                    regForm.reset();
                } catch (err) {
                    UIManager.showError('register-error', err.message || 'Registration failed');
                } finally {
                    UIManager.hideLoading();
                }
            });
        }
        
        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => AuthService.logout());
        
        // Search - UPDATED: Only search on Enter key press
        const search = document.getElementById('product-search');
        if (search) {
            search.placeholder = "Search ID, code, name, category, building, assigned, condition... [Press Enter to search]";
            
            // Search on Enter key
            search.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    await DataService.searchProducts(e.target.value);
                }
            });
        }
        
        // Clear search
        document.getElementById('clear-search')?.addEventListener('click', async () => {
            if (search) search.value = '';
            AppState.currentSearchTerm = null;
            AppState.currentSearchType = null;
            await DataService.loadProductsPaginated(1);
            Utils.showNotification('Filters cleared', 'info');
        });
        
        // Toggle archived
        document.getElementById('toggle-archived')?.addEventListener('click', () => DataService.toggleShowArchived());
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const view = this.dataset.view;
                if (view) App.switchView(view);
                document.getElementById('sidebar')?.classList.remove('active');
                document.getElementById('sidebar-overlay')?.classList.remove('active');
            });
        });
        
        // Stock management
        document.getElementById('stock-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleStockAdjustment(e);
        });
        
        document.getElementById('stock-product')?.addEventListener('change', () => this.handleProductSelect());
        
        document.querySelectorAll('.btn-type').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.btn-type').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                App.handleStockTypeChange();
            });
        });
        
        // Password change
        document.getElementById('password-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handlePasswordChange(e);
        });
        
        // CRUD forms
        document.getElementById('product-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleProductSave(e);
        });
        
        document.getElementById('category-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleCategorySave(e);
        });
        
        document.getElementById('building-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await this.handleBuildingSave(e);
        });
        
        // Movement filter
        document.getElementById('movement-filter')?.addEventListener('change', () => this.filterMovements());
        
        // Modal close on background click
        window.onclick = e => {
            if (e.target.classList?.contains('modal')) {
                e.target.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const si = document.getElementById('product-search');
                if (si && document.getElementById('products-view').classList.contains('active')) {
                    si.focus();
                    si.select();
                }
            }
            
            // Ctrl/Cmd + Shift + I: Toggle interface
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.toggleInterface();
            }
        });
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // MOBILE MENU
    // ═══════════════════════════════════════════════════════════════════════
    
    setupMobileMenu() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
            
            sidebar.addEventListener('click', (e) => {
                const clickedInteractive = e.target.closest('button') || 
                                          e.target.closest('a') || 
                                          e.target.closest('input') ||
                                          e.target.closest('select') ||
                                          e.target.closest('textarea');
                
                const clickedNavItem = e.target.closest('.nav-item');
                
                if (!clickedInteractive && !clickedNavItem) {
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                }
            });
            
            const sidebarHeader = sidebar.querySelector('.sidebar-header');
            if (sidebarHeader) {
                sidebarHeader.addEventListener('click', (e) => {
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                        sidebar.classList.toggle('active');
                        overlay.classList.toggle('active');
                    }
                });
            }
            
            const sidebarFooter = sidebar.querySelector('.sidebar-footer');
            if (sidebarFooter) {
                sidebarFooter.addEventListener('click', (e) => {
                    if (!e.target.closest('button') && !e.target.closest('a')) {
                        sidebar.classList.toggle('active');
                        overlay.classList.toggle('active');
                    }
                });
            }
            
            sidebar.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                });
            });
            
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                    e.preventDefault();
                    sidebar.classList.toggle('active');
                    overlay.classList.toggle('active');
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // INTERFACE TOGGLE
    // ═══════════════════════════════════════════════════════════════════════
    
    setupInterfaceToggle() {
        document.querySelectorAll('.logo-text, .sidebar-header h2, .app-title, [data-app-name]').forEach(element => {
            if (element.textContent.includes('Inventory') || element.dataset.appName === 'Inventory') {
                element.classList.add('interface-toggle');
                element.setAttribute('title', 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables');
                
                if (!element.querySelector('.database-indicator')) {
                    const dbIndicator = document.createElement('span');
                    dbIndicator.className = 'database-indicator interface1';
                    dbIndicator.id = 'database-indicator';
                    dbIndicator.textContent = 'Computer & Electronics';
                    element.appendChild(dbIndicator);
                }
                
                if (!element.querySelector('.interface-tooltip')) {
                    const tooltip = document.createElement('span');
                    tooltip.className = 'interface-tooltip';
                    tooltip.textContent = 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables';
                    element.appendChild(tooltip);
                }
                
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                newElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleInterface();
                });
            }
        });
        
        document.querySelectorAll('.logo, .app-logo, .brand').forEach(element => {
            if (!element.classList.contains('interface-toggle')) {
                element.style.cursor = 'pointer';
                element.setAttribute('title', 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables');
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
                newElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleInterface();
                });
            }
        });
    },
    
    addInterfaceToggleButton() {
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (!sidebarFooter) return;
        
        const existingBtn = document.getElementById('interface-toggle-btn');
        if (existingBtn) existingBtn.remove();
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'interface-toggle-btn';
        toggleBtn.className = 'btn-inventory interface-switch-btn';
        toggleBtn.setAttribute('title', 'Click to switch: Computer Equipment & Electronics ↔ Office Supplies & Consumables');
        
        const isInterface1 = AppState.currentInterface === 'interface1';
        toggleBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Switch to ${isInterface1 ? 'Office Supplies' : 'Computer & Electronics'}`;
        
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleInterface();
        });
        
        const logoutBtn = sidebarFooter.querySelector('.btn-logout');
        if (logoutBtn) {
            sidebarFooter.insertBefore(toggleBtn, logoutBtn);
        } else {
            sidebarFooter.insertBefore(toggleBtn, sidebarFooter.firstChild);
        }
        
        this.interfaceToggleBtn = toggleBtn;
    },
    
    updateInterfaceToggleButton() {
        if (this.interfaceToggleBtn) {
            const isInterface1 = AppState.currentInterface === 'interface1';
            this.interfaceToggleBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Switch to ${isInterface1 ? 'Office Supplies' : 'Computer & Electronics'}`;
        }
    },
    
    toggleInterface() {
        AppState.saveCurrentState();
        
        AppState.currentInterface = AppState.currentInterface === 'interface1' ? 'interface2' : 'interface1';
        
        AppState.loadInterfaceState(AppState.currentInterface);
        UIManager.updateInterfaceIndicator();
        this.updateInterfaceToggleButton();
        
        const activeView = document.querySelector('.nav-item.active')?.dataset.view;
        if (activeView) {
            this.switchView(activeView);
        } else {
            DataService.loadDashboard();
        }
        
        Utils.showNotification(`Switched to ${AppState.getCurrentInterfaceLabel()}`, 'info');
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // STOCK MANAGEMENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
    handleStockTypeChange() {
        const pid = AppState.selectedProductId;
        if (pid) {
            const product = AppState.products.find(p => p.id === pid);
            const warning = document.getElementById('stock-warning');
            const active = document.querySelector('.btn-type.active');
            
            if (active?.dataset.type === 'OUT' && warning && product) {
                warning.textContent = `⚠️ Available: ${product.stock_quantity || 0} units`;
                warning.style.display = 'block';
            } else if (warning) {
                warning.textContent = '';
                warning.style.display = 'none';
            }
        }
    },
    
    handleProductSelect() {
        const id = document.getElementById('stock-product')?.value;
        
        if (!id) {
            const info = document.getElementById('stock-info');
            if (info) info.style.display = 'none';
            AppState.selectedProductId = null;
            return;
        }
        
        AppState.selectedProductId = parseInt(id);
        const product = AppState.products.find(p => p.id === AppState.selectedProductId);
        
        if (product) {
            const info = document.getElementById('stock-info');
            const current = document.getElementById('current-stock');
            const warning = document.getElementById('stock-warning');
            
            if (info) info.style.display = 'block';
            if (current) current.textContent = `Current Stock: ${product.stock_quantity || 0}`;
            
            const active = document.querySelector('.btn-type.active');
            if (active?.dataset.type === 'OUT' && warning) {
                warning.textContent = `⚠️ Available: ${product.stock_quantity || 0} units`;
                warning.style.display = 'block';
            } else if (warning) {
                warning.textContent = '';
                warning.style.display = 'none';
            }
        }
    },
    
    async handleStockAdjustment(e) {
        e.preventDefault();
        
        if (!AppState.selectedProductId) {
            Utils.showNotification('Please select a product', 'error');
            return;
        }
        
        const qty = Utils.parseInteger(document.getElementById('stock-quantity')?.value);
        if (!qty || qty <= 0) {
            Utils.showNotification('Please enter a valid quantity (greater than 0)', 'error');
            return;
        }
        
        const type = document.querySelector('.btn-type.active')?.dataset.type;
        if (!type) {
            Utils.showNotification('Please select IN or OUT', 'error');
            return;
        }
        
        try {
            await DataService.adjustStock(
                AppState.selectedProductId,
                qty,
                type,
                document.getElementById('stock-reference')?.value?.trim(),
                document.getElementById('stock-notes')?.value?.trim()
            );
            this.clearStockForm();
        } catch (err) {
            Utils.showNotification(err.message || 'Adjustment failed', 'error');
        }
    },
    
    clearStockForm() {
        const form = document.getElementById('stock-form');
        if (form) form.reset();
        
        const info = document.getElementById('stock-info');
        if (info) info.style.display = 'none';
        
        const warning = document.getElementById('stock-warning');
        if (warning) warning.textContent = '';
        
        AppState.selectedProductId = null;
        
        const select = document.getElementById('stock-product');
        if (select) select.value = '';
        
        const inBtn = document.querySelector('.btn-type[data-type="IN"]');
        const outBtn = document.querySelector('.btn-type[data-type="OUT"]');
        if (inBtn) inBtn.classList.add('active');
        if (outBtn) outBtn.classList.remove('active');
    },
    
    filterMovements() {
        const filter = document.getElementById('movement-filter')?.value;
        
        if (filter === 'current' && AppState.selectedProductId) {
            DataService.renderMovementsTable(
                AppState.movements.filter(m => m.product_id === AppState.selectedProductId)
            );
        } else {
            DataService.renderMovementsTable(AppState.movements);
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // NAVIGATION & VIEWS
    // ═══════════════════════════════════════════════════════════════════════
    
    switchView(viewName) {
        UIManager.updateNavigation(viewName);
        
        const sections = {
            dashboard: 'dashboard-home',
            products: 'products-view',
            categories: 'categories-view',
            buildings: 'buildings-view',
            stock: 'stock-view',
            reports: 'reports-view',
            profile: 'profile-view'
        };
        
        const section = sections[viewName];
        if (section) UIManager.showSection(section);
        
        switch (viewName) {
            case 'dashboard':
                DataService.loadDashboard();
                break;
            case 'products':
                if (AppState.currentSearchTerm) {
                    DataService.searchProductsPaginated(AppState.currentSearchTerm, AppState.pagination.currentPage || 1);
                } else {
                    DataService.loadProductsPaginated(AppState.pagination.currentPage || 1);
                }
                break;
            case 'categories':
                DataService.loadCategories();
                break;
            case 'buildings':
                DataService.loadBuildings();
                break;
            case 'stock':
                DataService.loadStockView();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    },
    
    loadProfile() {
        if (AppState.currentUser) {
            const name = document.getElementById('profile-fullname');
            const email = document.getElementById('profile-username');
            const role = document.getElementById('profile-role');
            
            if (name) name.textContent = AppState.currentUser.full_name;
            if (email) email.textContent = AppState.currentUser.email;
            if (role) role.textContent = AppState.currentUser.role;
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PASSWORD MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    async handlePasswordChange(e) {
        e.preventDefault();
        try {
            UIManager.showLoading();
            await AuthService.changePassword(
                document.getElementById('current-password')?.value,
                document.getElementById('new-password')?.value,
                document.getElementById('confirm-password')?.value
            );
            Utils.showNotification('Password changed successfully', 'success');
            document.getElementById('password-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Password change failed', 'error');
        } finally {
            UIManager.hideLoading();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CRUD MODAL HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
    async showProductModal(id = null) {
        const modal = document.getElementById('product-modal');
        if (!modal) return;

        await Promise.all([DataService.loadCategoriesSelect(), DataService.loadBuildingsSelect()]);

        const title = document.getElementById('modal-title');

        if (id) {
            if (title) title.textContent = 'Edit Product';
            try {
                const supabase = window.getSupabaseClient();
                const { data, error } = await supabase
                    .from(TABLES.PRODUCTS)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (data) {
                    if (data.is_active === false) {
                        Utils.showNotification('This product is archived. Please restore it first to edit.', 'warning');
                        return;
                    }
                    document.getElementById('product-id').value = data.id;
                    document.getElementById('product-sku').value = data.sku || '';
                    document.getElementById('product-name').value = data.name || '';
                    document.getElementById('product-description').value = data.description || '';
                    document.getElementById('product-category').value = data.category_id || '';
                    document.getElementById('product-building').value = data.building_id || '';
                    document.getElementById('product-stock').value = data.stock_quantity || 0;
                    document.getElementById('product-condition').value = data.condition || PRODUCT_CONDITIONS.DEFAULT;
                    document.getElementById('product-assigned').value = data.assigned_to || '';
                }
            } catch (err) {
                console.error('Load product failed:', err);
                Utils.showNotification('Failed to load product', 'error');
                return;
            }
        } else {
            if (title) title.textContent = 'Add Product';
            const form = document.getElementById('product-form');
            if (form) form.reset();
            document.getElementById('product-id').value = '';
            document.getElementById('product-stock').value = '0';
            document.getElementById('product-condition').value = PRODUCT_CONDITIONS.DEFAULT;
            document.getElementById('product-assigned').value = '';

            const nextId = await Utils.getNextAvailableId(TABLES.PRODUCTS);

            const existingInfo = modal.querySelector('.id-info');
            if (existingInfo) existingInfo.remove();

            const infoMsg = document.createElement('div');
            infoMsg.className = 'id-info';
            infoMsg.style.cssText = 'background:#2f3850;padding:12px;border-radius:6px;margin-bottom:15px;border-left:4px solid #2196f3;';

            if (nextId) {
                infoMsg.innerHTML = `<i class="fas fa-info-circle"></i> <strong>Auto-assigned ID:</strong> ${nextId}`;
            } else {
                infoMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Warning:</strong> No available IDs. Maximum capacity reached.`;
                const saveBtn = modal.querySelector('button[type="submit"]');
                if (saveBtn) saveBtn.disabled = true;
            }

            const formElement = modal.querySelector('form');
            if (formElement && !modal.querySelector('.id-info')) {
                formElement.insertBefore(infoMsg, formElement.firstChild);
            }
        }

        UIManager.openModal('product-modal');
    },
    
    async handleProductSave(e) {
        e.preventDefault();
        const id = document.getElementById('product-id')?.value;
        
        const data = {
            name: document.getElementById('product-name')?.value?.trim(),
            sku: document.getElementById('product-sku')?.value?.trim(),
            description: document.getElementById('product-description')?.value?.trim(),
            category_id: document.getElementById('product-category')?.value ? parseInt(document.getElementById('product-category').value) : null,
            building_id: document.getElementById('product-building')?.value ? parseInt(document.getElementById('product-building').value) : null,
            stock_quantity: parseInt(document.getElementById('product-stock')?.value) || 0,
            assigned_to: document.getElementById('product-assigned')?.value?.trim() || null,
            condition: document.getElementById('product-condition')?.value?.trim() || PRODUCT_CONDITIONS.DEFAULT
        };
        
        try {
            await DataService.saveProduct(data, id ? parseInt(id) : null);
            UIManager.closeModal('product-modal');
            document.getElementById('product-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Failed to save product', 'error');
        }
    },
    
    async showCategoryModal(id = null) {
        if (id) {
            const supabase = window.getSupabaseClient();
            if (!supabase) {
                Utils.showNotification('Database unavailable', 'error');
                return;
            }
            
            const { data, error } = await supabase
                .from(TABLES.CATEGORIES)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                Utils.showNotification('Failed to load category', 'error');
                return;
            }
            
            document.getElementById('category-modal-title').textContent = 'Edit Category';
            document.getElementById('category-id').value = data.id;
            document.getElementById('category-name').value = data.name || '';
            document.getElementById('category-description').value = data.description || '';
        } else {
            document.getElementById('category-modal-title').textContent = 'Add Category';
            document.getElementById('category-id').value = '';
            document.getElementById('category-form')?.reset();
        }
        
        UIManager.openModal('category-modal');
    },
    
    async handleCategorySave(e) {
        e.preventDefault();
        const id = document.getElementById('category-id')?.value;
        
        const data = {
            name: document.getElementById('category-name')?.value?.trim(),
            description: document.getElementById('category-description')?.value?.trim()
        };
        
        try {
            await DataService.saveCategory(data, id ? parseInt(id) : null);
            UIManager.closeModal('category-modal');
            document.getElementById('category-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Failed to save category', 'error');
        }
    },
    
    async showBuildingModal(id = null) {
        if (id) {
            const supabase = window.getSupabaseClient();
            if (!supabase) {
                Utils.showNotification('Database unavailable', 'error');
                return;
            }
            
            const { data, error } = await supabase
                .from(TABLES.BUILDINGS)
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                Utils.showNotification('Failed to load building', 'error');
                return;
            }
            
            document.getElementById('building-modal-title').textContent = 'Edit Building';
            document.getElementById('building-id').value = data.id;
            document.getElementById('building-name').value = data.name || '';
            document.getElementById('building-address').value = data.location_address || '';
        } else {
            document.getElementById('building-modal-title').textContent = 'Add Building';
            document.getElementById('building-id').value = '';
            document.getElementById('building-form')?.reset();
        }
        
        UIManager.openModal('building-modal');
    },
    
    async handleBuildingSave(e) {
        e.preventDefault();
        const id = document.getElementById('building-id')?.value;
        
        const data = {
            name: document.getElementById('building-name')?.value?.trim(),
            location_address: document.getElementById('building-address')?.value?.trim()
        };
        
        try {
            await DataService.saveBuilding(data, id ? parseInt(id) : null);
            UIManager.closeModal('building-modal');
            document.getElementById('building-form')?.reset();
        } catch (err) {
            Utils.showNotification(err.message || 'Failed to save building', 'error');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // DELETE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
    async deleteProduct(id) {
        await DataService.deleteProduct(id);
    },
    
    async deleteCategory(id) {
        await DataService.deleteCategory(id);
    },
    
    async deleteBuilding(id) {
        await DataService.deleteBuilding(id);
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // REPORTS
    // ═══════════════════════════════════════════════════════════════════════
    
    async showReport(type) {
        const results = document.getElementById('report-results');
        const title = document.getElementById('report-title');
        
        if (!results || !title) return;
        
        results.style.display = 'block';
        title.textContent = {
            'stock-summary': 'Stock Summary',
            'category-analysis': 'Category Analysis',
            'building-analysis': 'Building Analysis',
            'movement-history': 'Movement History'
        }[type] || 'Report';
        
        try {
            await DataService.generateReport(type);
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            const content = document.getElementById('report-content');
            if (content) {
                content.innerHTML = `<p style="color:var(--danger);text-align:center;padding:20px">Report generation failed: ${err.message}</p>`;
            }
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

window.App = App;
window.editProduct = (id) => App.showProductModal(id);
window.deleteProduct = (id) => App.deleteProduct(id);
window.editCategory = (id) => App.showCategoryModal(id);
window.deleteCategory = (id) => App.deleteCategory(id);
window.editBuilding = (id) => App.showBuildingModal(id);
window.deleteBuilding = (id) => App.deleteBuilding(id);
window.showProductModal = (id) => App.showProductModal(id);
window.showCategoryModal = (id) => App.showCategoryModal(id);
window.showBuildingModal = (id) => App.showBuildingModal(id);
window.showRegisterModal = () => UIManager.openModal('register-modal');
window.closeModal = (id) => UIManager.closeModal(id);
window.showReport = (type) => App.showReport(type);
window.filterMovements = () => App.filterMovements();
window.clearStockForm = () => App.clearStockForm();
window.toggleInterface = () => App.toggleInterface();
window.goToPage = (page) => DataService.goToPage(page);
window.changeItemsPerPage = (value) => DataService.changeItemsPerPage(value);

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => App.init());
