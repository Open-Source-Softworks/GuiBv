# GuiBV Browser Gaming Platform - Design Guidelines

## Design Approach
**Hybrid Approach**: Combine Discord's gaming-focused UI patterns with Linear's clean utility design. Draw from Steam's game library interfaces and Notion's organizational structure. This creates a modern, performance-focused platform that balances entertainment and functionality.

## Core Design Principles
1. **Performance-First**: Minimal animations, optimized loading states
2. **Content Density**: Maximize visible games/content without clutter
3. **Quick Access**: Everything within 2 clicks maximum
4. **Visual Hierarchy**: Clear separation between browser, games, and settings

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, modern, excellent readability
- **Gaming Accent Font**: Space Grotesk (Google Fonts) - for headings and game titles
- **Hierarchy**:
  - Hero/Main Headings: Space Grotesk, text-4xl to text-6xl, font-bold
  - Section Headings: Space Grotesk, text-2xl to text-3xl, font-semibold
  - Game Titles: Space Grotesk, text-lg, font-medium
  - Body/UI Text: Inter, text-sm to text-base, font-normal
  - Labels/Meta: Inter, text-xs to text-sm, font-medium, uppercase tracking-wide

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 (e.g., p-4, gap-6, m-8, py-16)
- Consistent padding: p-4 for cards, p-6 for sections, p-8 for major containers
- Gap spacing: gap-4 for tight grids, gap-6 for comfortable spacing, gap-8 for sections

**Grid Structure**:
- Desktop: 4-5 column game grid (grid-cols-5)
- Tablet: 3 column (md:grid-cols-3)
- Mobile: 2 column (grid-cols-2)
- Sidebar: Fixed 280px width on desktop, overlay on mobile

## Component Library

### Navigation
- **Persistent Sidebar** (left edge, 280px):
  - Logo at top
  - Main navigation items with icons (Home, Games, Browser, Bookmarks, Settings)
  - Notifications bell icon in header
  - Collapsible on mobile (hamburger menu)

### Game Cards
- **Aspect Ratio**: 3:4 portrait cards
- **Structure**: Image thumbnail, gradient overlay at bottom, game title overlaid
- **Hover State**: Subtle scale (scale-105), lift shadow
- **Loading**: Skeleton animation (bg-pulse)
- **Grid Layout**: Consistent gaps, responsive columns

### Browser Interface
- **Address Bar**: Full-width, rounded input with search icon, suggestions dropdown
- **Tabs**: Chrome-style tabs with close buttons, add new tab button
- **Bookmarks Bar**: Icon + label format, edit mode toggle
- **Viewport**: Full-width iframe container with rounded corners

### Modals & Overlays
- **Notifications Panel**: Right-side slide-in (360px), list of notifications with icons, timestamps, read/unread states
- **Settings Modal**: Center modal (max-w-2xl), tabbed sections, clean form inputs
- **Game Source Selector**: Dropdown with radio options
- **Update Prompts**: Centered card modal with icon, title, description, CTA button

### Educational Sections
- **Category Cards**: 2-3 column grid, icon + title + brief description
- **Accordion Lists**: Expandable sections for subjects/services
- **Clean Layout**: Generous spacing (py-16), centered max-w-5xl container

### Status & Loading States
- **Skeleton Loaders**: For game thumbnails, bookmarks, tab favicons
- **Fetch States**: "Fetching games..." with subtle animation
- **Error States**: Clear messaging with retry actions

## Images
- **No Hero Image**: This is a utility app, jump straight to content
- **Game Thumbnails**: Essential - display actual game cover art via API
- **Bookmark Favicons**: Small icons (16x16) for bookmarked sites
- **Category Icons**: Use Heroicons for educational categories and navigation
- **Placeholder Images**: Use neutral geometric patterns for missing thumbnails

## Layout Sections

### Main Dashboard
1. **Top Bar**: Search, notifications icon, user menu (h-16)
2. **Sidebar**: Navigation (w-70, fixed)
3. **Content Area**: Game grid with category filters above
4. **No Footer**: Utility app doesn't need one

### Game Grid Page
- Filter bar with category pills (horizontal scroll on mobile)
- Search input (top right)
- 4-5 column responsive grid
- Infinite scroll or pagination
- Sorting options (Popular, Recent, A-Z)

### Browser Tab
- Address bar with controls (back, forward, refresh, home)
- Bookmarks bar (toggle visibility)
- Full iframe viewport
- Tab management header

### Settings Modal
- Tabbed navigation (General, Proxy, Decoy, Game Sources, About)
- Form sections with clear labels
- Toggle switches for boolean options
- Dropdown selects for choices
- Save/Cancel buttons (sticky footer)

### Notifications Panel
- Slide-in from right (w-96)
- "Mark all as read" header action
- List of notification cards
- Each card: Icon, title, description, timestamp, version badge
- Expandable details for updates
- Empty state when no notifications

## Accessibility
- Keyboard navigation for all interactive elements
- Focus states on all inputs (ring-2 ring-offset-2)
- Screen reader labels for icon-only buttons
- High contrast text (ensure readability)
- Proper heading hierarchy (h1 → h6)

## Animation Guidelines
**Minimal Animations Only**:
- Card hover: transform scale-105, duration-200
- Skeleton loading: animate-pulse
- Modal entrance: fade + slide (duration-300)
- Sidebar toggle: slide transition (duration-300)
- NO scroll animations, parallax, or decorative motion

## Responsive Behavior
- **Desktop (lg:)**: Full sidebar visible, 5-column game grid
- **Tablet (md:)**: Collapsible sidebar, 3-column grid
- **Mobile (base)**: Hidden sidebar (hamburger), 2-column grid, stacked sections

This design prioritizes speed, clarity, and functionality while maintaining modern gaming aesthetics.