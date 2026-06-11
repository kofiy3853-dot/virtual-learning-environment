// Faculty and Department Configuration
// Complete institutional structure for course organization

const FACULTIES = {
  FOE: {
    name: 'Faculty of Engineering',
    departments: {
      'Automotive Engineering': ['B.Tech Automotive Engineering', 'HND Automotive Engineering'],
      'Civil Engineering': ['B.Tech Civil Engineering', 'HND Civil Engineering'],
      'Mechanical Engineering': ['B.Tech Mechanical Engineering (Plant)', 'B.Tech Mechanical Engineering (Production)', 'HND Mechanical Engineering', 'B.Tech Welding and Fabrication Engineering'],
      'Electrical/Electronic Engineering': ['B.Tech Electrical and Electronic Engineering', 'HND Electrical/Electronic Engineering', 'B.Tech Telecommunication and Networking Engineering', 'B.Tech Mechatronics Engineering'],
      'Energy Systems Engineering': ['B.Tech Renewable Energy Systems Engineering', 'HND Renewable Energy Systems Engineering']
    }
  },
  FAST: {
    name: 'Faculty of Applied Science and Technology',
    departments: {
      'Computer Science': ['B.Tech Computer Science', 'HND Computer Science', 'HND Computer Network Management', 'B.Tech Information and Communication Technology (ICT)', 'B.Tech Artificial Intelligence and Robotics'],
      'Applied Mathematics and Statistics': ['B.Tech Actuarial Science', 'B.Tech Statistics', 'HND Statistics'],
      'Food and Postharvest Technology': ['B.Tech Food Technology', 'HND Food Technology', 'B.Tech Food Safety and Toxicology', 'B.Tech Post-Harvest Technology', 'HND Postharvest Technology'],
      'Fashion Design and Textiles': ['B.Tech Fashion Design and Textiles', 'HND Fashion Design and Textiles'],
      'Graphic Design': ['B.Tech Graphic Design']
    }
  },
  FBMS: {
    name: 'Faculty of Business and Management Studies',
    departments: {
      'Accountancy': ['B.Tech Accounting and Finance', 'HND Accountancy'],
      'Marketing': ['B.Tech Marketing', 'HND Marketing'],
      'Procurement and Supply Science': ['B.Tech Procurement and Supply Chain Management', 'HND Purchasing and Supply'],
      'Secretaryship and Management Studies': ['B.Tech Secretaryship and Management Studies', 'HND Secretaryship and Management Studies']
    }
  },
  FBNE: {
    name: 'Faculty of Built and Natural Environment',
    departments: {
      'Building Technology': ['B.Tech Building Services Technology', 'B.Tech Construction Technology and Management', 'B.Tech Commercial Practice and Quantity Surveying', 'HND Building Technology'],
      'Environmental Management and Technology': ['B.Tech Environmental Management and Technology', 'HND Environmental Management and Technology', 'B.Tech Real Estate Management', 'B.Tech Integrated Development Planning']
    }
  },
  FHAS: {
    name: 'Faculty of Health and Allied Sciences',
    departments: {
      'Biomedical Engineering Technology': ['B.Tech Biomedical Engineering', 'HND Biomedical Engineering Technology'],
      'Medical Laboratory Sciences': ['B.Tech Medical Laboratory Sciences'],
      'Rehabilitation Engineering': ['B.Tech Rehabilitation Engineering']
    }
  },
  SGS: {
    name: 'School of Graduate Studies',
    departments: {
      'Postgraduate Programmes': ['MSc Accounting and Finance', 'MSc Computer Science', 'MSc Data Science', 'MSc Health Informatics', 'MSc Procurement and Supply Chain Management', 'MSc Digital Marketing and Business Analytics']
    }
  }
};

// Export faculty codes for validation
const FACULTY_CODES = Object.keys(FACULTIES);

// Flatten to get all departments for easier lookup
const getAllDepartments = () => {
  const deps = {};
  Object.entries(FACULTIES).forEach(([faculty, data]) => {
    Object.keys(data.departments).forEach(dept => {
      deps[dept] = faculty;
    });
  });
  return deps;
};

module.exports = { FACULTIES, FACULTY_CODES, getAllDepartments };
