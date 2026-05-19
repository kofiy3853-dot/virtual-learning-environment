const express = require('express');
const {
  createLiveSession,
  getLiveSessions,
  startSession,
  endSession,
  joinSession,
} = require('../controllers/liveSessionController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Course level
router.route('/')
  .post(protect, authorize('teacher', 'admin'), validate(schemas.createLiveSession), createLiveSession)
  .get(protect, getLiveSessions);

// Session level
router.patch('/:id/start', protect, authorize('teacher', 'admin'), startSession);
router.patch('/:id/end', protect, authorize('teacher', 'admin'), endSession);
router.get('/:id/join', protect, joinSession);

module.exports = router;
