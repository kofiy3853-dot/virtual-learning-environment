const AdminLog = require('../models/AdminLog');

// @desc    Get all admin action logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
exports.getLogs = async (req, res, next) => {
  const { page = 1, limit = 20, action } = req.query;
  const query = {};

  if (action) query.action = action;

  const skip = (page - 1) * limit;
  const count = await AdminLog.countDocuments(query);
  const logs = await AdminLog.find(query)
    .populate('adminId', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));
  res.status(200).json({
    success: true,
    count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
    data: logs
  });
};

// @desc    Get logs filtered by specific user (as target)
// @route   GET /api/admin/logs/:userId
// @access  Private (Admin)
exports.getUserLogs = async (req, res, next) => {
  const logs = await AdminLog.find({ targetId: req.params.userId, targetModel: 'User' })
    .populate('adminId', 'name email')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: logs });
};
