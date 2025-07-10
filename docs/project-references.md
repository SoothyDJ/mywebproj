 
# Web Automation Platform - Project References

**File Path**: `/docs/project-references.md`

---

## Project Overview
Building a fullstack AI web automation platform that can scrape YouTube videos, analyze content, and generate interactive reports with storyboards.

---

## Reference Log

### REF-001: Project Rules Established
- **Date**: Current session
- **Context**: Development methodology
- **Details**: 
  - One script at a time
  - Full paths to all scripts
  - Complete script edits only
  - Modular architecture
  - Minimal script length while maintaining organization
  - Ask before assumptions
  - Reference-based conversation memory

### REF-002: Technology Stack Decision
- **Date**: Current session
- **Context**: Technical architecture
- **Details**:
  - Frontend: React with TypeScript
  - Backend: Node.js with Express
  - Database: PostgreSQL (user requirement)
  - Web Scraping: Puppeteer
  - AI Integration: OpenAI/Claude APIs
  - Styling: Tailwind CSS

### REF-003: Core Functionality Goal
- **Date**: Current session
- **Context**: Main feature requirements
- **Details**:
  - YouTube video scraping for specific topics
  - AI analysis of video content
  - Interactive report generation
  - Storyboard creation for video narration
  - Link attribution system

### REF-004: Development Start Point
- **Date**: Current session
- **Context**: Project initiation
- **Details**: User confirmed to start with reference tracking system

### REF-005: Reference Tracking System Created
- **Date**: Current session
- **Context**: Project organization
- **Details**: Reference tracking system created at `/docs/project-references.md`

### REF-006: Database Schema Started
- **Date**: Current session
- **Context**: Database foundation
- **Details**: User chose to start with any module - database schema created first

### REF-007: Database Schema Completed
- **Date**: Current session
- **Context**: Database structure
- **Details**: Complete PostgreSQL schema with users, tasks, videos, and storyboard tables

### REF-008: Project Setup Script Created
- **Date**: Current session
- **Context**: Project structure automation
- **Details**: Batch script created for folder and file structure setup

### REF-009: Batch Script Confirmation
- **Date**: Current session
- **Context**: Project structure ready
- **Details**: Batch script created for project setup

### REF-010: Project Structure Confirmed
- **Date**: Current session
- **Context**: Development ready
- **Details**: Project structure confirmed, proceeding with reference tracking system

---

## Directory Structure
```
/web-automation-platform
├── /frontend                 # React TypeScript app
│   ├── /src
│   │   ├── /components
│   │   ├── /pages
│   │   ├── /hooks
│   │   ├── /services
│   │   ├── /types
│   │   └── /utils
│   └── /public
├── /backend                  # Node.js Express API
│   ├── /routes
│   ├── /controllers
│   ├── /middleware
│   ├── /services
│   ├── /database
│   └── /models
├── /database                 # PostgreSQL schemas/migrations
│   ├── /migrations
│   └── /seeds
├── /scraping                 # Web scraping modules
│   ├── /utils
│   └── /parsers
├── /ai-services              # AI integration services
│   ├── /processors
│   └── /generators
├── /shared                   # Shared types/utilities
│   ├── /types
│   ├── /utils
│   └── /constants
├── /config                   # Configuration files
└── /docs                     # Documentation & references
```

---

## Files Created
1. `/setup-project.bat` - Project structure setup script
2. `/docs/project-references.md` - This reference file
3. `/database/schema.sql` - Database schema (created earlier)

---

## Key Decisions Made
1. Reference system using REF-### format
2. PostgreSQL for data persistence
3. Modular architecture approach
4. Full script methodology
5. Project structure automated with batch script

---

## Next Action Items
- [ ] Populate database schema file
- [ ] Create backend connection module
- [ ] Set up basic Express server
- [ ] Create YouTube scraper module
- [ ] Build AI integration layer
- [ ] Create React frontend components

---

## Usage Notes
- Each conversation point gets a REF-### number
- Reference this file when context is needed
- Update after each significant decision
- Keep conversation continuity across sessions
- Use full file paths for all references