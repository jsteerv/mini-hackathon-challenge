# Habit Tracker - Product Requirements Document

## 1. Executive Summary

Habit Tracker is a personal web application designed to help users build and maintain positive habits through daily tracking and streak-based motivation. The app provides a simple, focused interface for marking daily habit completions while visualizing progress through streak counters and calendar views.

The core value proposition is leveraging the psychological power of streaks - the "don't break the chain" method - to drive consistent habit formation. By making progress visible and maintaining streak counts, users stay motivated to continue their positive behaviors day after day.

The MVP goal is to deliver a fully functional, locally-hosted habit tracking application that a single user can run on their machine, with the ability to easily share with friends who can run their own instances.

## 2. Mission

### Mission Statement
Empower individuals to build lasting positive habits through simple, streak-based tracking that makes consistency visible and rewarding.

### Core Principles
1. **Simplicity First** - Focus on core functionality without feature bloat
2. **Visual Motivation** - Make streaks and progress immediately visible
3. **Zero Friction** - Daily check-ins should take seconds, not minutes
4. **Personal Ownership** - Users own their data locally, no accounts needed
5. **Shareable Design** - Easy for friends to clone and run their own instance

## 3. Target Users

### Primary Persona: Self-Motivated Individual
- **Profile:** Someone looking to build better habits for the new year
- **Technical Level:** Comfortable running local development servers, familiar with basic command line
- **Context:** Uses the app daily via web browser (desktop or mobile)
- **Pain Points:**
  - Existing habit apps are bloated with features they don't need
  - Don't want to pay for subscription services
  - Want full control over their data
  - Need visual motivation to maintain consistency

### Secondary Persona: Friends of Primary User
- **Profile:** Friends who want to use the same app after seeing it work
- **Technical Level:** Can follow instructions to clone a repo and run commands
- **Context:** Run their own local instance independently
- **Need:** Simple setup process to get their own copy running

## 4. MVP Scope

### In Scope

**Core Functionality**
- ✅ Create new habits with custom names
- ✅ Delete existing habits
- ✅ Mark habits as complete for the current day
- ✅ Unmark habits if marked by mistake
- ✅ View current streak count for each habit
- ✅ View calendar/history of completions for each habit
- ✅ Day resets at midnight local time

**Technical**
- ✅ FastAPI backend with REST API
- ✅ React frontend with responsive design
- ✅ PostgreSQL database for persistence
- ✅ Mobile-responsive UI (works on phone browsers)
- ✅ Local development setup (runs on user's machine)

**Deployment**
- ✅ Clear setup instructions for local development
- ✅ Easy to clone and run for friends

### Out of Scope

**Features Deferred to Future**
- ❌ User authentication/accounts
- ❌ Multi-user support on single instance
- ❌ Cloud deployment/hosting
- ❌ Push notifications/reminders
- ❌ Data export/backup functionality
- ❌ Statistics and analytics dashboard
- ❌ Habit categories/tags
- ❌ Custom habit frequencies (weekly, etc.)
- ❌ Social features (sharing streaks with friends)
- ❌ Mobile native apps (iOS/Android)
- ❌ Dark mode

## 5. User Stories

### Primary User Stories

**US1: Create a Habit**
> As a user, I want to create a new habit to track, so that I can start building consistency.

*Example: User clicks "Add Habit", enters "Morning meditation", and sees it appear in their habit list.*

**US2: Complete a Habit**
> As a user, I want to mark a habit as done for today, so that my streak continues.

*Example: User sees their "Exercise" habit, clicks the check button, and watches their streak increment from 5 to 6 days.*

**US3: View My Streaks**
> As a user, I want to see my current streak for each habit at a glance, so that I feel motivated to maintain them.

*Example: User opens the app and immediately sees "Reading: 12 days 🔥" displayed prominently.*

**US4: View Habit History**
> As a user, I want to see a calendar view of when I completed a habit, so that I can visualize my consistency over time.

*Example: User clicks on "Morning meditation" and sees a monthly calendar with green checkmarks on completed days.*

**US5: Undo a Completion**
> As a user, I want to unmark a habit if I checked it by mistake, so that my data stays accurate.

*Example: User accidentally marks "No social media" as complete, clicks it again to unmark, and their streak adjusts accordingly.*

**US6: Remove a Habit**
> As a user, I want to delete a habit I no longer want to track, so that my list stays relevant.

*Example: User decides to stop tracking "Wake up at 6am", clicks delete, confirms, and it disappears from their list.*

**US7: Use on Mobile**
> As a user, I want to check off habits from my phone browser, so that I can track habits anywhere.

*Example: User opens the app URL on their phone, sees a mobile-optimized layout, and easily taps to complete their habits.*

### Technical User Story

**US8: Easy Setup for Friends**
> As a friend of the primary user, I want simple setup instructions, so that I can run my own instance without hassle.

*Example: Friend clones the repo, runs `docker-compose up` or a few npm/pip commands, and has their own working habit tracker.*

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│                 │ ◄────────────────► │                 │
│  React Frontend │                    │  FastAPI Backend│
│  (Port 3000)    │                    │  (Port 8000)    │
│                 │                    │                 │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                │ SQL
                                                ▼
                                       ┌─────────────────┐
                                       │                 │
                                       │   PostgreSQL    │
                                       │   (Port 5432)   │
                                       │                 │
                                       └─────────────────┘
```

### Directory Structure

```
habit-tracker/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── database.py       # Database connection
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── habits.py     # Habit CRUD endpoints
│   ├── requirements.txt
│   └── alembic/              # Database migrations (optional)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HabitList.jsx
│   │   │   ├── HabitCard.jsx
│   │   │   ├── AddHabitForm.jsx
│   │   │   └── CalendarView.jsx
│   │   ├── api/
│   │   │   └── habits.js     # API client functions
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── public/
├── docker-compose.yml        # Optional: containerized setup
└── README.md
```

### Key Design Patterns

1. **REST API Pattern** - Clean CRUD endpoints for habits and completions
2. **Repository Pattern** - Database operations abstracted in models
3. **Component-Based UI** - React components for reusability
4. **Single Source of Truth** - Backend is authoritative for all data

### Technology-Specific Patterns

**FastAPI**
- Pydantic models for request/response validation
- Dependency injection for database sessions
- Automatic OpenAPI documentation at `/docs`

**React**
- Functional components with hooks
- useState/useEffect for state management (no Redux needed for MVP)
- Fetch API for backend communication

**PostgreSQL**
- Simple relational schema
- Timestamp-based queries for streak calculation

## 7. Core Features

### Feature 1: Habit Management

**Purpose:** Allow users to create and manage their list of habits to track.

**Operations:**
- Create habit with name
- List all habits with current streaks
- Delete habit (with confirmation)

**Key Details:**
- Habit names should be unique (prevent duplicates)
- Deleting a habit removes all associated completion history
- No limit on number of habits (reasonable for personal use)

### Feature 2: Daily Check-In

**Purpose:** Enable users to mark habits as complete for the current day.

**Operations:**
- Mark habit complete for today
- Unmark habit (toggle off)
- View today's completion status for all habits

**Key Details:**
- Each habit can only be completed once per day
- "Today" is determined by midnight local time
- Visual feedback on completion (checkmark, color change)

### Feature 3: Streak Tracking

**Purpose:** Calculate and display consecutive day streaks to motivate users.

**Operations:**
- Calculate current streak for each habit
- Display streak prominently on habit card
- Update streak in real-time when marking complete

**Key Details:**
- Streak = consecutive days with completion, ending today or yesterday
- If today is not complete but yesterday was, streak still shows (user hasn't missed yet)
- If yesterday was missed, streak resets to 0 (or 1 if today is complete)
- Visual emphasis for long streaks (fire emoji 🔥 for 7+ days)

### Feature 4: Calendar/History View

**Purpose:** Visualize habit completion history over time.

**Operations:**
- View monthly calendar for a habit
- See which days were completed (visual markers)
- Navigate between months

**Key Details:**
- Green/filled indicators for completed days
- Current day highlighted
- Shows current month by default
- Simple month navigation (previous/next)

## 8. Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.100+ | Web framework |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | 2.0+ | Data validation |
| Uvicorn | 0.23+ | ASGI server |
| psycopg2-binary | 2.9+ | PostgreSQL driver |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| React | 18+ | UI framework |
| Vite | 5+ | Build tool |
| CSS | - | Styling (no framework needed) |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Data persistence |

### Optional Dependencies
| Technology | Purpose |
|------------|---------|
| Docker & Docker Compose | Containerized setup |
| Alembic | Database migrations |

## 9. Security & Configuration

### Authentication Approach
**MVP: No Authentication**
- Single-user local application
- No login required
- Access controlled by network (localhost only by default)

### Configuration Management

**Environment Variables (backend/.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/habittracker
CORS_ORIGINS=http://localhost:3000
```

**Frontend Configuration**
```javascript
// src/config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### Security Scope

**In Scope:**
- ✅ Input validation on all API endpoints
- ✅ SQL injection prevention (via SQLAlchemy ORM)
- ✅ CORS configuration for local development

**Out of Scope for MVP:**
- ❌ HTTPS (local development uses HTTP)
- ❌ Rate limiting
- ❌ API authentication tokens
- ❌ Data encryption at rest

### Deployment Considerations
- App runs on localhost by default
- To share on local network, bind to 0.0.0.0 (document security implications)
- Friends should run their own instances, not share one

## 10. API Specification

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### Habits

**GET /habits**
List all habits with current streak.

*Response 200:*
```json
{
  "habits": [
    {
      "id": 1,
      "name": "Morning meditation",
      "created_at": "2025-01-01T00:00:00Z",
      "current_streak": 5,
      "completed_today": true
    }
  ]
}
```

**POST /habits**
Create a new habit.

*Request:*
```json
{
  "name": "Exercise"
}
```

*Response 201:*
```json
{
  "id": 2,
  "name": "Exercise",
  "created_at": "2025-01-02T00:00:00Z",
  "current_streak": 0,
  "completed_today": false
}
```

**DELETE /habits/{habit_id}**
Delete a habit and all its history.

*Response 204: No content*

#### Completions

**POST /habits/{habit_id}/complete**
Mark habit as complete for today.

*Response 200:*
```json
{
  "habit_id": 1,
  "date": "2025-01-02",
  "current_streak": 6
}
```

**DELETE /habits/{habit_id}/complete**
Remove today's completion (unmark).

*Response 200:*
```json
{
  "habit_id": 1,
  "date": "2025-01-02",
  "current_streak": 5
}
```

**GET /habits/{habit_id}/history**
Get completion history for calendar view.

*Query params:*
- `month` (optional): YYYY-MM format, defaults to current month

*Response 200:*
```json
{
  "habit_id": 1,
  "month": "2025-01",
  "completed_dates": ["2025-01-01", "2025-01-02", "2025-01-03"]
}
```

## 11. Success Criteria

### MVP Success Definition
The MVP is successful when a user can:
1. Add habits they want to track
2. Check off habits daily and see streaks grow
3. View their history and feel motivated by their consistency
4. Run the app locally without issues

### Functional Requirements
- ✅ User can create a new habit
- ✅ User can delete an existing habit
- ✅ User can mark a habit complete for today
- ✅ User can unmark a habit
- ✅ User can see current streak for each habit
- ✅ User can view monthly calendar of completions
- ✅ Streaks calculate correctly across day boundaries
- ✅ UI works on both desktop and mobile browsers

### Quality Indicators
- App loads in under 2 seconds locally
- No data loss on page refresh
- Streak calculations are accurate
- UI is intuitive without documentation

### User Experience Goals
- Daily check-in takes less than 30 seconds
- Streaks are immediately visible on the main screen
- Mobile experience is touch-friendly
- Visual feedback confirms all actions

## 12. Implementation Phases

### Phase 1: Foundation
**Goal:** Set up project structure and basic backend

**Deliverables:**
- ✅ Initialize FastAPI project structure
- ✅ Set up PostgreSQL database and connection
- ✅ Create SQLAlchemy models (Habit, Completion)
- ✅ Implement basic CRUD endpoints for habits
- ✅ Test API endpoints with Swagger UI

**Validation:** Can create, list, and delete habits via API

---

### Phase 2: Core Logic
**Goal:** Implement completions and streak calculation

**Deliverables:**
- ✅ Add completion endpoints (mark/unmark)
- ✅ Implement streak calculation logic
- ✅ Add history endpoint for calendar data
- ✅ Handle timezone/midnight reset correctly
- ✅ Write tests for streak edge cases

**Validation:** Streaks calculate correctly, including edge cases (missed days, new habits)

---

### Phase 3: Frontend
**Goal:** Build React UI

**Deliverables:**
- ✅ Initialize React project with Vite
- ✅ Create HabitList component (main view)
- ✅ Create HabitCard component with streak display
- ✅ Create AddHabitForm component
- ✅ Create CalendarView component
- ✅ Connect frontend to API
- ✅ Add responsive CSS for mobile

**Validation:** Full user workflow works in browser

---

### Phase 4: Polish & Documentation
**Goal:** Prepare for sharing with friends

**Deliverables:**
- ✅ Error handling and loading states
- ✅ Visual polish (colors, spacing, feedback)
- ✅ README with setup instructions
- ✅ docker-compose.yml for easy setup (optional)
- ✅ Test full flow on mobile browser

**Validation:** A friend can clone repo and run the app following README

## 13. Future Considerations

### Post-MVP Enhancements
- **Data Export:** JSON/CSV export for backup
- **Statistics Dashboard:** Completion rates, best streaks, charts
- **Habit Categories:** Group habits by type (health, productivity, etc.)
- **Custom Frequencies:** Weekly habits, X times per week
- **Dark Mode:** Toggle between light/dark themes

### Integration Opportunities
- **Calendar Sync:** Export to Google Calendar / iCal
- **Reminder System:** Optional email or browser notifications
- **Cloud Deployment:** Host on Railway, Render, or similar for easy access

### Advanced Features
- **Multi-User:** Add authentication for shared hosting
- **Social Features:** Share streaks, accountability partners
- **Mobile Apps:** React Native or PWA for native experience
- **Gamification:** Badges, achievements, milestones

## 14. Risks & Mitigations

### Risk 1: Streak Calculation Bugs
**Risk:** Edge cases in streak logic cause incorrect counts, frustrating users.
**Mitigation:** Write comprehensive unit tests for streak calculation covering: new habits, missed days, timezone boundaries, and leap years.

### Risk 2: Data Loss
**Risk:** PostgreSQL data gets corrupted or accidentally deleted.
**Mitigation:** Document simple backup procedure (pg_dump). For MVP, this is acceptable risk for local use.

### Risk 3: Complex Setup for Friends
**Risk:** Friends struggle to set up PostgreSQL and dependencies.
**Mitigation:** Provide docker-compose.yml for one-command setup. Include detailed README with troubleshooting.

### Risk 4: Scope Creep
**Risk:** Adding "just one more feature" delays the MVP.
**Mitigation:** Stick to defined scope. Document future ideas but don't implement until MVP is complete and validated.

### Risk 5: Timezone Handling
**Risk:** Midnight reset doesn't work correctly across timezones.
**Mitigation:** Use browser's local time for "today" determination. Store completion dates as dates (not timestamps with timezone).

## 15. Appendix

### Database Schema

```sql
CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE completions (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(habit_id, completed_date)
);

CREATE INDEX idx_completions_habit_date ON completions(habit_id, completed_date);
```

### Streak Calculation Logic

```python
def calculate_streak(habit_id: int, today: date) -> int:
    """
    Calculate current streak for a habit.

    Rules:
    - Count consecutive days ending today or yesterday
    - If today is not complete but yesterday was, streak continues
    - If yesterday was missed, streak is 0 (or 1 if today complete)
    """
    completions = get_completions_descending(habit_id)

    streak = 0
    check_date = today

    # If today isn't complete, start checking from yesterday
    if not is_completed(habit_id, today):
        check_date = today - timedelta(days=1)

    # Count consecutive completed days
    while is_completed(habit_id, check_date):
        streak += 1
        check_date -= timedelta(days=1)

    return streak
```

### Key Dependencies
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
