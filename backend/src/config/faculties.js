// Faculty and Department Configuration
// Defines the institutional structure for course organization

const FACULTIES = {
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
};

// Export faculty codes for validation
const FACULTY_CODES = Object.keys(FACULTIES);

module.exports = { FACULTIES, FACULTY_CODES };
