# Implementation Plan: Faculty-Based Course Structure

## Overview

This plan refactors the course system from generic categories to an institution-aligned faculty structure with departments and academic levels. Implementation follows a backend-first approach to ensure data integrity before updating the frontend UI.

## Tasks

- [x] 1. Create Faculty Configuration File
  - Create `backend/src/config/faculties.js` with five faculties and their departments
  - Export FACULTIES constant with proper structure
  - Include all departments listed in design document
  - _Requirements: 1.1, 1.2_

- [x] 2. Update Course Model Schema
  - Modify `backend/src/models/Course.js`
  - Remove `category` field
  - Add `faculty` field with enum validation for five faculties
  - Add `department` field as required string
  - Change `level` enum from ['beginner', 'intermediate', 'advanced'] to [100, 200, 300, 400]
  - _Requirements: 3.1, 3.2_

- [x] 3. Update Backend Validation Schema
  - Modify `backend/src/middleware/validation.js`
  - Update `createCourseSchema` to validate faculty and department
  - Add validation that department is valid for selected faculty
  - Change level validation to accept only [100, 200, 300, 400]
  - Update `updateCourseSchema` similarly
  - _Requirements: 3.3, 3.4_

- [x] 4. Add Validation Helper Function
  - Add function to `backend/src/middleware/validation.js` or controller
  - Function validates that department belongs to faculty
  - Used during course creation and update
  - Returns error if invalid combination
  - _Requirements: 5.1, 5.2_

- [x] 5. Update Course Controller
  - Modify `backend/src/controllers/courseController.js` createCourse endpoint
  - Add faculty/department validation before saving
  - Update error handling for invalid faculty/department combinations
  - Test with both valid and invalid data
  - _Requirements: 3.4, 5.1, 5.2_

- [x] 6. Update Frontend Types
  - Modify `frontend/types/index.ts`
  - Update Course interface: replace `category` with `faculty` and `department`
  - Change level type from 'beginner' | 'intermediate' | 'advanced' to 100 | 200 | 300 | 400
  - _Requirements: 4.2_

- [x] 7. Create Frontend Faculty Configuration
  - Create `frontend/lib/faculties.ts`
  - Export FACULTIES object matching backend structure
  - Export ACADEMIC_LEVELS constant [100, 200, 300, 400]
  - _Requirements: 4.1_

- [x] 8. Update CourseWizard Component - Form State
  - Modify `frontend/components/builder/CourseWizard.tsx`
  - Update CourseFormState interface: remove category, add faculty and department
  - Update form dispatch handlers for faculty and department
  - Initialize form with empty faculty/department
  - _Requirements: 4.3, 4.4_

- [x] 9. Update CourseWizard Component - Level Selector
  - Modify `frontend/components/builder/CourseWizard.tsx`
  - Replace level buttons (beginner/intermediate/advanced) with (100/200/300/400)
  - Update button styling and labels
  - Ensure form captures correct numeric values
  - _Requirements: 4.3_

- [x] 10. Update CourseWizard Component - Faculty/Department Selectors
  - Replace category select with faculty dropdown
  - Add department dropdown that populates based on selected faculty
  - Show "Select department" option when no faculty selected
  - Update styling to match existing form
  - _Requirements: 4.1, 4.2_

- [x] 11. Update Course API Client
  - Verify `frontend/utils/api/courseApi.ts` sends faculty/department in requests
  - Ensure create and update methods pass new fields to backend
  - _Requirements: 4.4_

- [x] 12. Test Course Creation with New Structure
  - Manually test creating course with valid faculty/department/level
  - Verify course saves correctly
  - Verify faculty and department appear in course details
  - Test with each faculty to ensure department dropdowns work
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3_

- [x] 13. Test API Validation
  - Test API rejects invalid faculty
  - Test API rejects invalid department for faculty
  - Test API rejects invalid level values
  - Verify error messages are helpful
  - _Requirements: 3.4, 5.1, 5.2_

- [x] 14. Update Course Display Components
  - Find components that display course category/level
  - Update to display faculty and department instead of category
  - Update level display to show numeric values (100/200/300/400)
  - Test in course listings and detail views
  - _Requirements: 5.3_

- [x] 15. Add Course Filtering by Faculty
  - Add optional faculty parameter to course listing API calls
  - Update course list components to filter by faculty if specified
  - Test filtering returns only courses from selected faculty
  - _Requirements: 5.4_

- [x] 16. Checkpoint - Verify Complete Refactoring
  - Create multiple courses with different faculty/department/level combinations
  - Verify all display correctly in course listings
  - Verify API validation catches errors
  - Verify filtering by faculty works
  - Verify level values display as 100/200/300/400 throughout UI
  - Ask user if any issues arise

- [x] 17. Run Full Build and Test Suite
  - Run `npm run build` in frontend
  - Run `npm run test` if tests exist
  - Verify no TypeScript errors
  - Verify no console warnings in browser
  - _Requirements: 3.1, 3.2, 3.3_

## Notes

- Tasks 1-5 are backend implementation (prerequisite for frontend)
- Tasks 6-11 are frontend types and API setup
- Tasks 12-15 are integration and testing
- Task 16 is comprehensive checkpoint before final testing
- All faculty/department mappings are defined in design document
- Both backend and frontend must validate faculty/department combinations for consistency

