/**
 * Calculates the final weighted grade based on assignment and quiz scores.
 * 
 * @param {Array} gradeItems - Array of grade item documents
 * @param {Object} weights - { assignmentWeight: Number, quizWeight: Number }
 * @returns {Object} - { finalPercentage, assignmentAverage, quizAverage }
 */
const calculateFinalGrade = (gradeItems, weights) => {
  const { assignmentWeight = 60, quizWeight = 40 } = weights || {};

  const assignments = gradeItems.filter(item => item.sourceType === 'assignment');
  const quizzes = gradeItems.filter(item => item.sourceType === 'quiz');

  const calculateAverage = (items) => {
    if (items.length === 0) return 0;
    const totalPercentage = items.reduce((acc, item) => acc + (item.percentage || 0), 0);
    return totalPercentage / items.length;
  };

  const assignmentAverage = calculateAverage(assignments);
  const quizAverage = calculateAverage(quizzes);

  // If one category has no items, we could either count it as 0 or 
  // distribute weight. Here we follow the fixed weight formula.
  const finalPercentage = (assignmentAverage * (assignmentWeight / 100)) + 
                          (quizAverage * (quizWeight / 100));

  return {
    finalPercentage: parseFloat(finalPercentage.toFixed(2)),
    assignmentAverage: parseFloat(assignmentAverage.toFixed(2)),
    quizAverage: parseFloat(quizAverage.toFixed(2)),
    weights
  };
};

module.exports = { calculateFinalGrade };
