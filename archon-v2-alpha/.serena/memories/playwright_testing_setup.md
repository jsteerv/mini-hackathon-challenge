# Playwright Testing Setup for Eskerium

## Test Credentials
- **URL**: http://localhost:3738 (Docker instance with HMR)


## Playwright Commands

### Basic Navigation
```javascript
// Navigate to projects
await browser_navigate(url="http://localhost:3738/projects")

// Take snapshot to see page structure
await browser_snapshot()

// Navigate to Docs Tab
await browser_click(element="Docs", ref="[ref_from_snapshot]")



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

### After Any Archon Server changes
- If having issues, try and restart the archon-server docker container. 

## Important Notes
- Docker has HMR (Hot Module Reload) for frontend changes
- Backend changes require container restart
- Always check console logs for errors
- Test both /portal (customer) and /dashboard (admin) sections