import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { fetchTestsByType, submitTest } from '../../services/testService';
import { fetchUserProfile } from '../../services/profileService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/admin/tableStates/DataTableStates';
import useUserStore from '../../store/useUserStore';
import TestResultCard from '../../components/test/TestResultCard';
import { getImageUrl } from '@/utils/imageUtils';

const TestPage = () => {
  const { type } = useParams(); // 'pre' or 'post'
  const navigate = useNavigate();
  const { getToken } = useAuth();


  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Answers state: { [test_id]: choice_id }
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const isPreTest = type === 'pre';
  const displayType = isPreTest ? 'Pre-Test' : 'Post-Test';

  const { preScore, postScore, setScores } = useUserStore();

  useEffect(() => {
    // Check if store has score
    if (isPreTest && preScore !== null && preScore !== undefined) {
      setResult({ score: preScore, alreadyDone: true });
      return;
    }
    if (!isPreTest && postScore !== null && postScore !== undefined) {
      setResult({ score: postScore, alreadyDone: true });
      return;
    }

    const initPage = async () => {
      try {
        setLoading(true);
        // 1. Ensure we have the latest profile/scores
        // (Store might be outdated if just reloaded)
        const profile = await fetchUserProfile(getToken);
        setScores(profile.pre_score, profile.post_score);

        // Check again with fresh data
        const currentPreScore = profile.pre_score;
        const currentPostScore = profile.post_score;

        if (isPreTest && currentPreScore !== null && currentPreScore !== undefined) {
          setResult({ score: currentPreScore, alreadyDone: true });
          setLoading(false);
          return;
        }
        if (!isPreTest && currentPostScore !== null && currentPostScore !== undefined) {
          setResult({ score: currentPostScore, alreadyDone: true });
          setLoading(false);
          return;
        }

        // 2. If not done, load questions
        const data = await fetchTestsByType(getToken, type);
        setTests(data);
      } catch (err) {
        if (err.response && err.response.status === 403 && err.response.data.missing_levels) {
          setResult({
            locked: true,
            missingLevels: err.response.data.missing_levels
          });
        } else {
          setError('Failed to load test questions. ' + (err.response?.data?.message || err.message));
        }
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [getToken, type, isPreTest, setScores]); // Removed preScore/postScore from dep array to avoid loops, rely on explicit fetch

  const handleChoiceSelect = (testId, choiceId) => {
    setAnswers(prev => ({
      ...prev,
      [testId]: choiceId
    }));
  };

  const handleSubmit = async () => {
    // Validate all questions answered?
    const unansweredCount = tests.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const answerArray = Object.entries(answers).map(([testId, choiceId]) => ({
        test_id: parseInt(testId),
        choice_id: choiceId
      }));

      const resultData = await submitTest(getToken, type, answerArray);
      setResult(resultData);

      // Refresh user profile to update score in global state
      const profile = await fetchUserProfile(getToken);
      setScores(profile.pre_score, profile.post_score);
    } catch (err) {
      setError('Failed to submit test. ' + err.message);
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    // If Pre-Test, redirect to map selection
    // If Post-Test, maybe home or profile
    navigate('/user/mapselect');
  };

  if (loading) return <div className="p-8"><LoadingState message="Loading Test..." /></div>;
  console.log("result", result);
  if (result) {
    return (
      <TestResultCard
        result={result}
        displayType={displayType}
        onContinue={handleContinue}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h1 className="text-2xl font-bold text-gray-900">{displayType}</h1>
          <p className="text-gray-500">Please answer all questions to proceed.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {tests.map((test, index) => (
            <Card key={test.test_id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-4">
                  <span className="font-bold text-lg mr-2">{index + 1}.</span>
                  <span className="text-lg font-medium">{test.question}</span>
                  {test.description && <p className="text-gray-500 mt-2 text-sm">{test.description}</p>}
                  {test.test_image && (
                    <img src={getImageUrl(test.test_image)} alt="Question" className="mt-4 max-h-64 object-contain rounded" />
                  )}
                </div>

                <div className="space-y-3">
                  {test.choices.map((choice) => (
                    <div
                      key={choice.test_choice_id}
                      onClick={() => handleChoiceSelect(test.test_id, choice.test_choice_id)}
                      className={`
                                        p-4 rounded-lg border cursor-pointer transition-all
                                        ${answers[test.test_id] === choice.test_choice_id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }
                                    `}
                    >
                      <div className="flex items-center">
                        <div className={`
                                            w-4 h-4 rounded-full border mr-3 flex items-center justify-center
                                            ${answers[test.test_id] === choice.test_choice_id
                            ? 'border-primary bg-primary'
                            : 'border-gray-400'
                          }
                                        `}>
                          {answers[test.test_id] === choice.test_choice_id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span>{choice.choice_text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
            className="w-full md:w-auto min-w-[200px]"
          >
            {submitting ? 'Submitting...' : 'Submit Answers'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
