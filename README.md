# RTI - Inventory Pro

A modern, full-featured inventory management system built with vanilla JavaScript, HTML5, CSS3, and Supabase backend.

## 📦 Features

### Core Functionality
- **User Authentication** - Secure login with bcrypt password hashing
- **Product Management** - Full CRUD operations for inventory items
- **Categories & Buildings** - Organize products by category and location
- **Stock Movements** - Track product movements with complete history
- **Soft Delete** - Archive products while preserving movement history
- **ID Search** - Enhanced search with highlighting (ID range 1-1000)
- **Mobile Responsive** - Optimized for mobile devices with touch-friendly UI
- **Real-time Clock** - Live timestamp display

### Product Conditions
- Working - Assigned
- Working - In Storage
- Defective
- Damaged

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Supabase (PostgreSQL) |
| Styling | Custom CSS with design tokens |
| Icons | Font Awesome 6 |
| Fonts | Inter (Google Fonts) |

## 📁 Project Structure

```
/workspace
├── index.html      # Main application HTML
├── app.js          # Application logic and state management
├── config.js       # Configuration (Supabase, constants)
├── style.css       # Complete stylesheet
├── database.sql    # Database schema and migrations
└── README.md       # This file
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Supabase account and project

### Installation

1. **Clone or download** this repository

2. **Set up Supabase Database**
   ```sql
   -- Run the database.sql file in your Supabase SQL Editor
   -- This creates all tables, functions, and triggers
   ```

3. **Configure Connection**
   Edit `config.js` with your Supabase credentials:
   ```javascript
   const SUPABASE_CONFIG = Object.freeze({
     URL: 'https://your-project.supabase.co',
     ANON_KEY: 'your-anon-key'
   });
   ```

4. **Open the Application**
   Simply open `index.html` in your web browser, or serve it with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

5. **Access** the application at `http://localhost:8000`

## 🗄️ Database Schema

The system uses the following main tables:

- **users** - User accounts and authentication
- **categories** - Product categories
- **buildings** - Storage locations
- **products** - Inventory items with soft delete support
- **movements** - Stock movement history
- **product_details** - Additional product information

## 🔐 Security Features

- Password hashing with bcrypt
- Environment-ready configuration
- Immutable configuration objects
- Input sanitization and XSS protection
- Soft delete for data integrity

## 🎨 UI Features

- Dark mode design system
- Responsive layout for all screen sizes
- Touch-optimized controls
- Loading states and animations
- Status color coding
- Archive view for deleted items

## 📝 Usage

### Login
Enter your credentials to access the inventory system.

### Managing Products
1. Navigate to the Products section
2. Click "Add Product" to create a new item
3. Fill in product details including:
   - Name and description
   - Category and building location
   - Condition status
   - Quantity
4. Use search to find products by ID or name
5. Edit or archive products as needed

### Stock Movements
Track all product movements with timestamps, source/destination locations, and responsible users.

## ⚙️ Configuration

See `config.js` for customizable options:
- Supabase connection settings
- Table names
- Product condition types
- UI color schemes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues or questions, please contact your system administrator.

---

**Built with ❤️ using modern web technologies**
