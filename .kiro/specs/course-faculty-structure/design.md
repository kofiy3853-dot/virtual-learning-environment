# Design Document: Faculty-Based Course Structure

## Overview

This design refactors the course system from generic categories to an institution-wide faculty hierarchy with departments and standardized academic levels. The change improves course organization, discoverability, and alignment with academic structure.

### Current State
- Categories: Hard-coded strings (Science, Technology, Business)
- Levels: Enum (beginner, intermediate, advanced)
- Structure: Flat, no institutional hierarchy

### Target State
- Faculties: Five fixed faculties (FAST, FBMS, FOE, FHAS, FBNE)
- Departments: Variable departments per faculty
- Levels: Numeric academic levels (100, 200, 300, 400)
- Structure: Hierarchical, institution-aligned

## Architecture

### Faculty-Department Hierarchy

```
FAST (Faculty of Applied Sciences and Technology)
├── Computer Science
├── Information Technology
├── Data Science
└── Software Engineering

FBMS (Faculty of Business and Management Sciences)
├── Management
├── Finance
├── Accounting
└── Economics

FOE (Faculty of Engineering)
├── Mechanical Engineering
├── Civil Engineering
├── Electrical Engineering
└── Software Engineering

FHAS (Faculty of Health and Allied Sciences)
├── Medicine
├── Nursing
├── Psychology
└── Public Health

FBNE (Faculty of Basic and Natural Sciences)
├── Mathematics
├── Physics
├── Chemistry
└── Biology
```

### Data Model Changes

**Before:**
```typescript
interface Course {
  category: string;  // "Science", "Technology", "Business"
  level: 'beginner' | 'intermediate' | 'advanced';
}
```

**After:**
```typescript
interface Course {
  faculty: 'FAST' | 'FBMS' | 'FOE' | 'FHAS' | 'FBNE';
  department: string;  // e.g., "Computer Science"
  level: 100 | 200 | 300 | 400;
}
```

### Component Architecture

#### Backend Changes

**1. Course Model (backend/src/models/Course.js)**
```javascript
faculty: {
  type: String,
  enum: ['FAST', 'FBMS', 'FOE', 'FHAS', 'FBNE'],
  required: true
},
department: {
  type: String,
  required: true
},
level: {
  type: Number,
  enum: [100, 200, 300, 400],
  required: true
}
```

**2. Validation Schema (backend/src/middleware/validation.js)**
```javascript
faculty: Joi.string()
  .valid('FAST', 'FBMS', 'FOE', 'FHAS', 'FBNE')
  .required(),
department: Joi.string()
  .min(2)
  .max(50)
  .required(),
level: Joi.number()
  .valid(100, 200, 300, 400)
  .required()
```

**3. Configuration File (new)**
Create `backend/src/config/faculties.js` with faculty-department mappings:
```javascript
const FACULTIES = {
  FAST: ['Computer Science', 'Information Technology', 'Data Science', 'Software Engineering'],
  FBMS: ['Management', 'Finance', 'Accounting', 'Economics'],
  FOE: ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Software Engineering'],
  FHAS: ['Medicine', 'Nursing', 'Psychology', 'Public Health'],
  FBNE: ['Mathematics', 'Physics', 'Chemistry', 'Biology']
};

module.exports = FACULTIES;
```

#### Frontend Changes

**1. Types Update (frontend/types/index.ts)**
```typescript
export interface Course {
  faculty: 'FAST' | 'FBMS' | 'FOE' | 'FHAS' | 'FBNE';
  department: string;
  level: 100 | 200 | 300 | 400;
  // ... other fields
}
```

**2. Configuration (frontend/lib/faculties.ts)**
```typescript
export const FACULTIES = {
  FAST: ['Computer Science', 'Information Technology', 'Data Science', 'Software Engineering'],
  FBMS: ['Management', 'Finance', 'Accounting', 'Economics'],
  FOE: ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Software Engineering'],
  FHAS: ['Medicine', 'Nursing', 'Psychology', 'Public Health'],
  FBNE: ['Mathematics', 'Physics', 'Chemistry', 'Biology']
} as const;

export const ACADEMIC_LEVELS = [100, 200, 300, 400] as const;
```

**3. CourseWizard Component (frontend/components/builder/CourseWizard.tsx)**
- Replace category select with faculty dropdown
- Add conditional department dropdown (shows departments for selected faculty)
- Replace level buttons (beginner/intermediate/advanced) with level buttons (100/200/300/400)
- Update form state to handle faculty/department

## Correctness Properties

### Property 1: Valid Faculty-Department Combination
For any course created, if `faculty` is set to a valid faculty, then `department` must be one of the allowed departments for that faculty.

**Validates: Requirement 5.1, 5.2**

### Property 2: Level Values Are Academic Levels
For any course record, the `level` field must be one of the four academic levels: 100, 200, 300, or 400.

**Validates: Requirement 2.2, 2.3**

### Property 3: Faculty Filtering Returns Correct Courses
When filtering courses by faculty, the result set contains only courses with that exact faculty value.

**Validates: Requirement 5.4**

## Error Handling

### Invalid Faculty
- **Error**: Request includes faculty value not in [FAST, FBMS, FOE, FHAS, FBNE]
- **Handling**: Return 400 error with message "Invalid faculty"
- **Recovery**: User must select from available faculties

### Invalid Department for Faculty
- **Error**: Request includes department not in FACULTIES[faculty]
- **Handling**: Return 400 error with message "Department not available for selected faculty"
- **Recovery**: User must select from faculty-specific departments

### Invalid Level
- **Error**: Request includes level not in [100, 200, 300, 400]
- **Handling**: Return 400 error with message "Level must be 100, 200, 300, or 400"
- **Recovery**: User must select from available levels

## Testing Strategy

### Unit Tests
- Validate faculty-department combinations
- Test level validation (only 100, 200, 300, 400 allowed)
- Test course creation with valid/invalid combinations

### Integration Tests
- Create course with valid faculty/department/level
- Attempt to create course with invalid faculty
- Attempt to create course with invalid department for faculty
- Verify API returns correct validation errors

### Property-Based Tests
- Generate random faculty values, verify only valid ones pass validation
- Generate random department/faculty combinations, verify validation
- Generate random level values, verify only 100/200/300/400 pass

