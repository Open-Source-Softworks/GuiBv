# GuiBV Browser Gaming Platform

## Overview

GuiBV is a browser-based gaming platform that allows users to play web games, browse the internet through an embedded browser, and manage bookmarks. The platform features a dark-themed gaming UI with a yellow color scheme, inspired by Discord and Steam, with a collapsible sidebar navigation and responsive design. The platform uses DuckDuckGo as the default search engine.

The application is built as a full-stack TypeScript project with a React frontend and Express backend, using in-memory storage for games, bookmarks, notifications, and user settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript, bundled with Vite
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Design System**: Custom gaming-focused theme with Inter and Space Grotesk fonts

**Key Frontend Features**:
- Collapsible sidebar navigation with Home, Games, Browser, Bookmarks, and Community pages
- Animated starfield background effect
- Dark/light theme toggle with persistent storage
- Notifications panel with read/unread state management
- Settings modal with tabbed interface
- Responsive grid layout for game cards (2-5 columns based on viewport)
- Community chat with real-time messaging (3-second polling)
- Recommendations box for user feature suggestions

### Backend Architecture

- **Framework**: Express 5 on Node.js
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Storage**: In-memory storage implementation with interface abstraction (`IStorage`)
- **Schema Validation**: Zod schemas shared between frontend and backend

**API Endpoints**:
- `GET/POST/PATCH/DELETE /api/bookmarks` - Bookmark CRUD operations
- `GET /api/games` - Games listing with optional category/search filters
- `GET/POST/PATCH/DELETE /api/notifications` - Notification management (POST/DELETE require admin auth)
- `GET/PATCH /api/settings` - User settings management
- `GET/POST/PATCH/DELETE /api/ads` - Ad management (POST/PATCH/DELETE require admin auth)
- `GET/POST/DELETE /api/chat` - Community chat messages (DELETE requires admin auth)
- `GET/POST /api/recommendations` - User recommendations (PATCH/DELETE require admin auth)
- `GET /api/proxy?url=<encoded_url>` - Server-side proxy for loading external websites in browser (Custom backend)
- WebSocket `/wisp/` - Wisp WebSocket server for Scramjet proxy backend

**Admin Panel**:
- Secret admin page accessible at `/gui-admin`
- Protected with Basic Auth (Username: GuiAdmin, Password: 1k16AunfH5)
- Allows management of notifications, paid advertisements, and user recommendations

### Data Storage

Currently uses in-memory storage with static game data. The architecture includes:
- Drizzle ORM configuration pointing to PostgreSQL (prepared for database migration)
- Schema definitions in `shared/schema.ts` using Zod for validation
- Storage interface pattern allowing easy swap between memory and database implementations

**Data Models**:
- Games: id, title, thumbnail, url, category, source
- Bookmarks: id, title, url, favicon
- Notifications: id, title, type, description, details, date, read status (persisted to ./data/notifications.json)
- Settings: searchEngine, gameSource (now includes gnmath/selenite/truffled/velara/duckmath), decoyTitle, decoyFavicon, proxyEnabled, proxyBackend (bridge/scramjet/ultraviolet), proxyTransport (libcurl/epoxy), wispServer, decoyEnabled
- ChatMessage: id, username, message, timestamp (persisted to ./data/chat.json)
- Recommendation: id, suggestion, submittedBy, timestamp, status (persisted to ./data/recommendations.json)

### Build System

- Development: Vite dev server with HMR, proxied through Express
- Production: Two-stage build using Vite for client and esbuild for server
- Output: Combined dist folder with server bundle and static client files

## External Dependencies

### Third-Party UI Libraries
- Radix UI primitives (dialog, dropdown, tabs, etc.)
- Embla Carousel for carousels
- cmdk for command palette functionality
- react-day-picker for calendar components
- vaul for drawer components

### Proxy System
- **Bridge Proxy (Default)**: Waves-style server-side proxy at `/!!/` with comprehensive URL rewriting
  - Routes: `/!!/<encoded-url>` for HTTP requests, `/!!/ws/<encoded-url>` for WebSocket connections
  - Full HTML/CSS/JS rewriting for links, forms, stylesheets, and scripts
  - JavaScript injection intercepts fetch, XHR, WebSocket, Worker APIs
  - Blocks analytics trackers (gtag, ga, fbq, analytics)
  - SSRF protection with private IP blocking
  - Raw body forwarding for POST/PUT/PATCH with proper Content-Type handling
  - WebSocket proxy using proper WebSocketServer handleUpgrade flow
- **Custom Proxy**: Server-side proxy at `/api/proxy` that fetches and rewrites URLs
- **Scramjet Proxy**: Client-side proxy using service workers with bare-mux transport layer
  - Uses Wisp WebSocket server at `/wisp/` endpoint (DNS: 1.1.1.3, 1.0.0.3)
  - Transport options: Libcurl (default) or Epoxy
  - Static files in `client/public/scramjet/`, `client/public/baremux/`, `client/public/libcurl/`, `client/public/epoxy/`
  - Service worker registered at `/scramjet/service/` scope
  - Scramjet frame at `/scramjet-frame.html` hosts proxied content
- **Ultraviolet Proxy**: Additional proxy backend option (uses similar infrastructure to Scramjet)

### Core Infrastructure
- PostgreSQL via `DATABASE_URL` environment variable (Drizzle configured)
- connect-pg-simple for session storage (available but not currently active)

### External Services
- CrazyGames: Game thumbnails and game URLs hosted externally
- Google Fonts: Inter, Space Grotesk, Fira Code, Geist Mono font families

### Development Tools
- Replit-specific Vite plugins for development (cartographer, dev-banner, error overlay)
- TypeScript with strict mode and path aliases (@/, @shared/, @assets/)