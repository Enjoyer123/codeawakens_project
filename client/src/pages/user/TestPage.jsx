import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/shared/DataTableStates';
import useUserStore from '../../store/useUserStore';
import TestResultCard from '../../components/test/TestResultCard';
import { getImageUrl } from '@/utils/imageUtils';
import { useTestsByType, useSubmitTest } from '../../services/hooks/useTests';
import { useProfile } from '../../services/hooks/useProfile';

const TestPage = () => {
  const { type } = useParams(); // 'pre' or 'post'
  const navigate = useNavigate();

  // Hooks
  const {
    data: tests,
    isLoading: loadingTests,
    isError: isTestsError,
    error: testsError
  } = useTestsByType(type);

  const {
    data: profile,
    isLoading: loadingProfile,
  } = useProfile();

  const submitTestMutation = useSubmitTest();

  // Local State
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false); // Can also use mutation.isPending
  const [error, setError] = useState(null);

  // Derived State
  const isPreTest = type === 'pre';
  const displayType = isPreTest ? 'Pre-Test' : 'Post-Test';
  const { setScores } = useUserStore();

  // Effect: Check completion status based on profile data
  useEffect(() => {
    if (profile) {
      // Sync store with latest profile
      setScores(profile.pre_score, profile.post_score);

      const currentPreScore = profile.pre_score;
      const currentPostScore = profile.post_score;

      if (isPreTest && currentPreScore !== null && currentPreScore !== undefined) {
        setResult({ score: currentPreScore, alreadyDone: true });
      } else if (!isPreTest && currentPostScore !== null && currentPostScore !== undefined) {
        setResult({ score: currentPostScore, alreadyDone: true });
      }
    }
  }, [profile, isPreTest, setScores]);

  // Effect: Handle Test Query Errors (e.g. 403 Missing Levels)
  useEffect(() => {
    if (isTestsError && testsError) {
      if (testsError.response && testsError.response.status === 403 && testsError.response.data.missing_levels) {
        setResult({
          locked: true,
          missingLevels: testsError.response.data.missing_levels
        });
      } else {
        // General error
        setError('Failed to load test questions. ' + (testsError.response?.data?.message || testsError.message));
      }
    }
  }, [isTestsError, testsError]);


  const handleChoiceSelect = (testId, choiceId) => {
    setAnswers(prev => ({
      ...prev,
      [testId]: choiceId
    }));
  };

  const handleSubmit = async () => {
    // Validate all questions answered?
    const questions = tests || [];
    const unansweredCount = questions.length - Object.keys(answers).length;

    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const answerArray = Object.entries(answers).map(([testId, choiceId]) => ({
        test_id: parseInt(testId),
        choice_id: choiceId
      }));

      const resultData = await submitTestMutation.mutateAsync({ type, answers: answerArray });
      setResult(resultData);

      // We should ideally invalidate 'userProfile' to get new scores, 
      // but submitTestMutation doesn't auto-invalidate 'userProfile' unless we update the hook.
      // However, the component relies on the *returned* resultData for the immediate UI.
      // And we updated the Store manually in the original code. 
      // But now we rely on useProfile to sync store.
      // So we should invalidate userProfile.
      // Ideally useProfile hook invalidating logic should be in mutation success, 
      // or we can just let the user navigate away.
      // But for correctness immediately after submit if they stay:
      // (The original code re-fetched profile manually).

      // Let's rely on Profile sync effect if we invalidate queries? 
      // Actually submitTest service probably updates backend.

    } catch (err) {
      setError('Failed to submit test. ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigate('/user/mapselect');
  };

  // Loading States
  if (loadingTests || loadingProfile) {
    return <div className="p-8"><LoadingState message="Loading Test..." /></div>;
  }

  // Result View
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
          {tests?.map((test, index) => (
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
                      <div className="flex items-start">
                        <div className={`
                                            w-4 h-4 rounded-full border mr-3 flex items-center justify-center flex-shrink-0 mt-1
                                            ${answers[test.test_id] === choice.test_choice_id
                            ? 'border-primary bg-primary'
                            : 'border-gray-400'
                          }
                                        `}>
                          {answers[test.test_id] === choice.test_choice_id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          {choice.choice_image && (
                            <img
                              src={getImageUrl(choice.choice_image)}
                              alt="Choice"
                              className="max-h-32 w-auto object-contain rounded border self-start"
                            />
                          )}
                          <span>{choice.choice_text}</span>
                        </div>
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
