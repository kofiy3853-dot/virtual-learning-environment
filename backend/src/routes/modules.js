const express = require('express');
const {
  getModules,
  createModule,
  updateModule,
  deleteModule,
} = require('../controllers/moduleController');

const {
  addContent,
  getModuleContent,
} = require('../controllers/contentController');

const upload = require('../middleware/upload');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Module routes (relative to /api/modules in some cases, but prompt has mixed patterns)
// Prompt says:
// GET /api/courses/:id/modules -> Course modules
// POST /api/courses/:id/modules -> Create module
// PUT /api/modules/:id -> Update module
// DELETE /api/modules/:id -> Delete module
// POST /api/modules/:id/content -> Add content
// GET /api/modules/:id/content -> Get content

// I'll handle /api/modules/:id here
router
  .route('/:id')
  .put(protect, authorize('teacher', 'admin'), updateModule)
  .delete(protect, authorize('teacher', 'admin'), deleteModule);

router
  .route('/:id/content')
  .get(protect, getModuleContent)
  .post(protect, authorize('teacher', 'admin'), upload.single('file'), addContent);

module.exports = router;
