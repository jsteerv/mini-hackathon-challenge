# Playwright Testing Setup for Eskerium

## Test Credentials
- **URL**: http://localhost:8080 (Docker instance with HMR)
- **Admin Login**: silo@example.com / local
- **Login Method**: Use password login at `/login?method=password`

## Playwright Commands

### Basic Navigation and Login
```javascript
// Navigate to login page
await browser_navigate(url="http://localhost:8080/login?method=password")

// Take snapshot to see page structure
await browser_snapshot()

// Fill login credentials
await browser_type(element="Email textbox", ref="[ref_from_snapshot]", text="silo@example.com")
await browser_type(element="Password textbox", ref="[ref_from_snapshot]", text="local")

// Click sign in
await browser_click(element="Sign in button", ref="[ref_from_snapshot]")

// Wait for navigation
await browser_wait_for(time=2)
```

### Testing Pattern
1. Navigate to each page/section
2. Take snapshot to identify elements
3. Check console for errors
4. Click all interactive elements
5. Document any errors or broken functionality

## Backend Commands

### After Django Model Changes
```bash
# Create migrations
docker-compose exec web python manage.py makemigrations

# Apply migrations
docker-compose exec web python manage.py migrate

# Restart container for changes
docker-compose restart web
```

## Important Notes
- Docker has HMR (Hot Module Reload) for frontend changes
- Backend changes require container restart
- Always check console logs for errors
- Test both /portal (customer) and /dashboard (admin) sections