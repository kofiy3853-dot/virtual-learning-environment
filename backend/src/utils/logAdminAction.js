const AdminLog = require('../models/AdminLog');

/**
 * Logs an administrative action to the audit trail.
 * 
 * @param {string} adminId - ID of the admin performing the action
 * @param {string} action - The action constant (e.g., 'DELETE_USER')
 * @param {string} targetModel - The model name affected
 * @param {string} targetId - The ID of the document affected
 * @param {object} metadata - Extra context for the action
 * @param {object} req - Express request object for IP extraction
 */
async function logAdminAction(adminId, action, targetModel, targetId, metadata, req) {
  try {
    await AdminLog.create({
      adminId,
      action,
      targetModel,
      targetId,
      metadata: metadata || {},
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
    // We don't throw here to avoid failing the main request if logging fails
  }
}

module.exports = logAdminAction;
