const express = require('express');

const router = express.Router();

// API Documentation object
const apiDocs = {
  version: '1.0.0',
  title: 'Virtual Learning Environment API',
  description: 'A comprehensive REST API for managing virtual classrooms',
  baseUrl: '/api',
  endpoints: {
    'Authentication': {
      'POST /auth/register': {
        description: 'Register a new user',
        body: { name: 'string', email: 'string', password: 'string', role: 'student|teacher|admin', department: 'string' },
        response: { success: 'boolean', token: 'JWT token' },
      },
      'POST /auth/login': {
        description: 'Login user',
        body: { email: 'string', password: 'string' },
        response: { success: 'boolean', token: 'JWT token' },
      },
      'GET /auth/me': {
        description: 'Get current user profile',
        auth: 'Required',
        response: { success: 'boolean', data: 'User object' },
      },
    },
    'Courses': {
      'GET /courses': {
        description: 'Get all courses',
        query: { page: 'number', limit: 'number' },
        response: { success: 'boolean', data: 'Array of courses' },
      },
      'GET /courses/:id': {
        description: 'Get course by ID',
        params: { id: 'Course ID' },
        response: { success: 'boolean', data: 'Course object' },
      },
      'POST /courses': {
        description: 'Create new course',
        auth: 'Required (Teacher/Admin)',
        body: { title: 'string', description: 'string', code: 'string', semester: 'string', academicYear: 'string' },
        response: { success: 'boolean', data: 'Created course object' },
      },
      'PUT /courses/:id': {
        description: 'Update course',
        auth: 'Required (Teacher/Admin)',
        params: { id: 'Course ID' },
        body: { title: 'string', description: 'string', code: 'string' },
        response: { success: 'boolean', data: 'Updated course object' },
      },
      'DELETE /courses/:id': {
        description: 'Delete course',
        auth: 'Required (Admin)',
        params: { id: 'Course ID' },
        response: { success: 'boolean' },
      },
    },
    'Assignments': {
      'GET /assignments': {
        description: 'Get assignments',
        query: { courseId: 'string' },
        response: { success: 'boolean', data: 'Array of assignments' },
      },
      'POST /courses/:id/assignments': {
        description: 'Create assignment in course',
        auth: 'Required (Teacher)',
        params: { id: 'Course ID' },
        body: { title: 'string', description: 'string', dueDate: 'ISO date', totalMarks: 'number' },
        response: { success: 'boolean', data: 'Created assignment object' },
      },
    },
    'Submissions': {
      'POST /assignments/:id/submit': {
        description: 'Submit assignment',
        auth: 'Required (Student)',
        params: { id: 'Assignment ID' },
        body: { textContent: 'string', fileUrls: 'Array of strings' },
        response: { success: 'boolean', data: 'Submission object' },
      },
      'PATCH /submissions/:id/grade': {
        description: 'Grade submission',
        auth: 'Required (Teacher)',
        params: { id: 'Submission ID' },
        body: { grade: 'number', feedback: 'string' },
        response: { success: 'boolean', data: 'Updated submission object' },
      },
    },
    'Quizzes': {
      'POST /courses/:id/quizzes': {
        description: 'Create quiz',
        auth: 'Required (Teacher)',
        params: { id: 'Course ID' },
        body: { title: 'string', duration: 'number (minutes)', startTime: 'ISO date', endTime: 'ISO date', totalMarks: 'number' },
        response: { success: 'boolean', data: 'Created quiz object' },
      },
    },
  },
  statusCodes: {
    200: 'OK - Request successful',
    201: 'Created - Resource created successfully',
    400: 'Bad Request - Invalid input',
    401: 'Unauthorized - Authentication required',
    403: 'Forbidden - Insufficient permissions',
    404: 'Not Found - Resource not found',
    500: 'Internal Server Error - Server error',
  },
};

// JSON API docs endpoint
router.get('/', (req, res) => {
  res.json(apiDocs);
});

// HTML API documentation UI
router.get('/html', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Virtual Learning Environment - API Documentation</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f8fafc;
          color: #1e293b;
          line-height: 1.6;
        }
        .container {
          max-width: 1000px;
          margin: 40px auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 60px 40px;
          text-align: center;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 12px; font-weight: 800; letter-spacing: -0.025em; }
        .header p { font-size: 1.125rem; opacity: 0.9; font-weight: 400; }
        .content { padding: 40px; }
        .section { margin-bottom: 48px; }
        .section-title {
          font-size: 1.5rem;
          color: #0f172a;
          margin-bottom: 24px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          font-weight: 700;
        }
        .endpoint {
          background: #fdfdfd;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #4f46e5;
          padding: 24px;
          margin-bottom: 20px;
          border-radius: 12px;
          transition: transform 0.2s;
        }
        .endpoint:hover { transform: translateY(-2px); }
        .endpoint-method {
          font-weight: 700;
          color: #4f46e5;
          font-size: 1.125rem;
          margin-bottom: 8px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .endpoint-desc { color: #475569; margin-bottom: 16px; font-size: 1rem; }
        .endpoint-detail { font-size: 0.875rem; color: #64748b; margin: 4px 0; }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-right: 8px;
        }
        .badge.get { background: #dbeafe; color: #1e40af; }
        .badge.post { background: #dcfce7; color: #166534; }
        .badge.put { background: #fef3c7; color: #92400e; }
        .badge.patch { background: #f3e8ff; color: #6b21a8; }
        .badge.delete { background: #fee2e2; color: #991b1b; }
        .footer {
          background: #f8fafc;
          padding: 32px;
          text-align: center;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          font-size: 0.875rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>API Documentation</h1>
          <p>Virtual Learning Environment v1.0.0</p>
        </div>
        <div class="content">
          ${Object.entries(apiDocs.endpoints).map(([section, endpoints]) => `
            <div class="section">
              <h2 class="section-title">${section}</h2>
              ${Object.entries(endpoints).map(([path, details]) => {
                const method = path.split(' ')[0];
                const route = path.split(' ')[1];
                return `
                  <div class="endpoint">
                    <div class="endpoint-method">
                      <span class="badge ${method.toLowerCase()}">${method}</span>
                      ${route}
                    </div>
                    <p class="endpoint-desc">${details.description}</p>
                    ${details.auth ? `<p class="endpoint-detail"><strong>Auth:</strong> ${details.auth}</p>` : ''}
                    ${details.body ? `<p class="endpoint-detail"><strong>Body:</strong> <code>${JSON.stringify(details.body)}</code></p>` : ''}
                    ${details.params ? `<p class="endpoint-detail"><strong>Params:</strong> <code>${JSON.stringify(details.params)}</code></p>` : ''}
                    ${details.response ? `<p class="endpoint-detail"><strong>Response:</strong> <code>${JSON.stringify(details.response)}</code></p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
          <div class="section">
            <h2 class="section-title">Status Codes</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
              ${Object.entries(apiDocs.statusCodes).map(([code, desc]) => `
                <div style="padding: 12px; background: #f1f5f9; border-radius: 8px;">
                  <strong style="color: #4f46e5;">${code}</strong>: ${desc}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 Virtual Learning Environment API
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

module.exports = router;
