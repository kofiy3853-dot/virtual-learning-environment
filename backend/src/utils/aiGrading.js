const { createCompletion } = require('./aiClient');

async function gradeSubmission(submissionContent, rubricCriteria, totalPoints, assignmentDescription) {
  try {
    const rubricText = rubricCriteria
      .map((c, i) => `${i + 1}. ${c.name} (${c.points} points): ${c.description}`)
      .join('\n');

    const response = await createCompletion([
      {
        role: 'system',
        content: `You are an expert educator grading student submissions. Evaluate against the rubric and respond with JSON only.\n\nAssignment: ${assignmentDescription}\nRubric:\n${rubricText}\nTotal Points: ${totalPoints}\n\nJSON format:\n{"totalScore":number,"percentage":number,"rubricScores":[{"criterion":string,"score":number,"maxScore":number,"feedback":string}],"strengths":[string],"improvements":[string],"generalFeedback":string,"suggestions":string,"grade":"A/B/C/D/F"}`,
      },
      { role: 'user', content: `Grade this submission:\n\n${submissionContent}` },
    ], 2000, 0.5);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    return { totalScore: 0, percentage: 0, rubricScores: [], strengths: [], improvements: [], generalFeedback: content, suggestions: '', grade: 'F' };
  } catch (error) {
    console.error('Error grading submission:', error.message);
    throw new Error('Failed to grade submission');
  }
}

async function gradeSubmissionsBatch(submissions, rubricCriteria, totalPoints, assignmentDescription) {
  try {
    const results = [];
    for (const submission of submissions) {
      const result = await gradeSubmission(submission.content, rubricCriteria, totalPoints, assignmentDescription);
      results.push({ submissionId: submission._id, studentId: submission.studentId, ...result });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return results;
  } catch (error) {
    console.error('Error grading batch submissions:', error.message);
    throw new Error('Failed to grade batch submissions');
  }
}

async function generateRubric(assignmentDescription, totalPoints = 100) {
  try {
    const response = await createCompletion([
      {
        role: 'system',
        content: `You are an expert educator creating grading rubrics. Total points: ${totalPoints}. Respond with JSON array only.\n\nFormat:\n[{"name":string,"description":string,"points":number,"levels":[{"level":string,"description":string}]}]`,
      },
      { role: 'user', content: `Create a rubric for:\n\n${assignmentDescription}` },
    ], 2000, 0.7);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    console.error('Error generating rubric:', error.message);
    throw new Error('Failed to generate rubric');
  }
}

async function compareGrades(aiGrade, teacherGrade) {
  try {
    const difference = Math.abs(aiGrade.totalScore - teacherGrade);
    const percentDifference = (difference / (aiGrade.totalScore || 1)) * 100;

    const response = await createCompletion([
      {
        role: 'system',
        content: `You are an expert educator analyzing grading consistency. Respond with JSON only.\n\nAI Grade: ${aiGrade.totalScore}, Teacher Grade: ${teacherGrade}, Difference: ${difference} points (${percentDifference.toFixed(1)}%)\n\nFormat:\n{"isConsistent":boolean,"consistencyScore":number,"insights":string,"possibleReasons":[string],"recommendations":string}`,
      },
      { role: 'user', content: `AI: ${aiGrade.totalScore}, Teacher: ${teacherGrade}` },
    ], 1000, 0.5);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    return { isConsistent: percentDifference < 10, consistencyScore: Math.max(0, 100 - percentDifference), insights: `Difference of ${difference} points`, possibleReasons: [], recommendations: '' };
  } catch (error) {
    console.error('Error comparing grades:', error.message);
    throw new Error('Failed to compare grades');
  }
}

async function generatePersonalizedFeedback(gradingResult, studentName) {
  try {
    const response = await createCompletion([
      {
        role: 'system',
        content: `You are an encouraging educator providing personalized feedback. Respond with JSON only.\n\nStudent: ${studentName}, Score: ${gradingResult.totalScore}, Grade: ${gradingResult.grade}\n\nFormat:\n{"greeting":string,"celebration":string,"strengths":[string],"improvements":[string],"actionItems":[string],"encouragement":string,"nextSteps":string}`,
      },
      { role: 'user', content: `Generate feedback for ${studentName} who scored ${gradingResult.totalScore} points` },
    ], 1500, 0.7);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    return { greeting: `Hello ${studentName}!`, celebration: '', strengths: gradingResult.strengths || [], improvements: gradingResult.improvements || [], actionItems: [], encouragement: 'Keep up the good work!', nextSteps: '' };
  } catch (error) {
    console.error('Error generating personalized feedback:', error.message);
    throw new Error('Failed to generate personalized feedback');
  }
}

module.exports = { gradeSubmission, gradeSubmissionsBatch, generateRubric, compareGrades, generatePersonalizedFeedback };
