# Requirements: Refactor Course Categories to Faculty-Based Structure

## Introduction

Currently, course categories are generic strings (Science, Technology, Business) and levels are beginner/intermediate/advanced. This refactoring restructures courses around an academic faculty hierarchy with departments and new standardized academic levels.

## Glossary

- **Faculty**: Top-level academic organizational unit (FAST, FBMS, FOE, FHAS, FBNE)
- **Department**: Sub-unit within a Faculty that offers courses
- **Academic Level**: Course difficulty/year level (100, 200, 300, 400)
- **Course**: Academic offering that belongs to a Faculty and Department

## Requirements

### Requirement 1: Define Faculty Structure

**User Story:** As an administrator, I want courses to be organized by the five faculties with their departments, so that the course catalog reflects institutional structure.

#### Acceptance Criteria

1. WHEN a course is created, THE form SHALL offer the five faculties: FAST, FBMS, FOE, FHAS, FBNE
2. WHEN a faculty is selected, THE form SHALL display available departments for that faculty
3. WHEN a course is saved, THE course record SHALL store both faculty and department fields
4. IF an invalid faculty is submitted, THE request SHALL be rejected with a 400 error

### Requirement 2: Replace Legacy Levels with Academic Levels

**User Story:** As an instructor, I want courses to use academic levels (100, 200, 300, 400) instead of beginner/intermediate/advanced, so that courses align with academic year structure.

#### Acceptance Criteria

1. WHEN creating or updating a course, THE level selector SHALL offer: 100, 200, 300, 400
2. WHEN a course is saved with a level, THE course record SHALL store the numeric level
3. THE API validation SHALL only accept levels: 100, 200, 300, 400
4. IF an existing course with old level values exists, THE system SHALL handle migration gracefully

### Requirement 3: Update Course Model and API

**User Story:** As a developer, I want the backend data model to reflect the new faculty/department structure with numeric levels, so that the database is source of truth.

#### Acceptance Criteria

1. THE Course model field `category` SHALL be replaced with `faculty` and `department` fields
2. THE Course model field `level` enum VALUES SHALL be: 100, 200, 300, 400
3. THE API validation schema SHALL reflect the new field names and allowed values
4. WHEN course data is created/updated, THE validation SHALL require valid faculty and department combinations

### Requirement 4: Update Course Creation UI

**User Story:** As a teacher, I want the course creation form to show faculty and department dropdowns instead of category text input and level buttons, so that course creation is guided by institution structure.

#### Acceptance Criteria

1. WHEN the course wizard basic info step loads, THE category field SHALL be replaced with a Faculty dropdown
2. WHEN a faculty is selected, A Department dropdown SHALL appear with department options for that faculty
3. THE level selector buttons SHALL display: 100, 200, 300, 400 instead of beginner/intermediate/advanced
4. WHEN the form is submitted, BOTH faculty and department values SHALL be included in the request

### Requirement 5: Maintain Data Consistency

**User Story:** As an administrator, I want the system to prevent invalid faculty/department combinations and maintain data integrity, so that the course catalog remains structured correctly.

#### Acceptance Criteria

1. IF a course record is created with a faculty that doesn't exist, THE system SHALL reject the request
2. IF a course record is created with a department not belonging to the selected faculty, THE system SHALL reject the request
3. WHEN fetching courses, THE response SHALL include both faculty and department in a readable format
4. WHEN filtering courses by faculty, THE result SHALL include only courses from that faculty

