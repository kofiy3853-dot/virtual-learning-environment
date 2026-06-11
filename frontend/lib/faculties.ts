// Faculty and Department Configuration
// Matches backend/src/config/faculties.js

export const FACULTIES = {
  FAST: {
    name: 'Faculty of Applied Sciences and Technology',
    departments: [
      'Computer Science',
      'Information Technology',
      'Data Science',
      'Software Engineering'
    ]
  },
  FBMS: {
    name: 'Faculty of Business and Management Sciences',
    departments: [
      'Management',
      'Finance',
      'Accounting',
      'Economics'
    ]
  },
  FOE: {
    name: 'Faculty of Engineering',
    departments: [
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Software Engineering'
    ]
  },
  FHAS: {
    name: 'Faculty of Health and Allied Sciences',
    departments: [
      'Medicine',
      'Nursing',
      'Psychology',
      'Public Health'
    ]
  },
  FBNE: {
    name: 'Faculty of Basic and Natural Sciences',
    departments: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology'
    ]
  }
} as const;

export const FACULTY_CODES = Object.keys(FACULTIES) as (keyof typeof FACULTIES)[];

export const ACADEMIC_LEVELS = [100, 200, 300, 400] as const;

export type Faculty = keyof typeof FACULTIES;
export type Level = typeof ACADEMIC_LEVELS[number];
