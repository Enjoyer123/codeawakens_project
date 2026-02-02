import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/shared/DataTableStates';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useUserTestHistory } from '../../../services/hooks/useAdmin';

const UserTestResultModal = ({ open, onOpenChange, user }) => {
    // If modal is closed or no user, we might not want to fetch or render
    const userId = user?.user_id || user?.id;
    const {
        data: testHistory = [],
        isLoading,
        isError
    } = useUserTestHistory(open && userId ? userId : null); // Only fetch if open and user exists

    if (!user) return null;

    const preTests = testHistory.filter(t => t.test_type === 'PreTest');
    const postTests = testHistory.filter(t => t.test_type === 'PostTest');

    const QuestionCard = ({ record, index }) => (
        <div className={`p-4 rounded-lg border mb-3 transition-all ${record.is_correct
            ? 'bg-white border-gray-200 hover:border-green-200 hover:shadow-sm'
            : 'bg-red-50/30 border-red-100 hover:border-red-200'
            }`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 ${record.is_correct ? 'text-green-500' : 'text-red-500'}`}>
                    {record.is_correct ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                        <h4 className="text-sm font-medium text-gray-900 leading-relaxed">
                            <span className="text-gray-400 mr-2">Q{index + 1}.</span>
                            {record.question}
                        </h4>
                        <Badge variant={record.is_correct ? "default" : "destructive"} className="shrink-0">
                            {record.is_correct ? "Correct" : "Wrong"}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm bg-gray-50/50 p-3 rounded-md">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 mb-1">User Answer</span>
                            <span className={`font-medium ${record.is_correct ? 'text-green-700' : 'text-red-600'}`}>
                                {record.user_choice}
                            </span>
                        </div>
                        {!record.is_correct && (
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 mb-1">Correct Answer</span>
                                <span className="font-medium text-green-700">
                                    {record.correct_choice}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center text-xs text-gray-400 mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(record.answered_at).toLocaleString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTestList = (tests) => {
        if (isLoading) return <div className="flex justify-center p-8"><Loader /></div>;
        if (isError) return <div className="p-8 text-center text-red-500">Failed to load history</div>;
        if (tests.length === 0) return <EmptyState message="No test data found." />;

        return (
            <div className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Detailed Results</h3>
                    {tests.map((record, idx) => (
                        <QuestionCard key={idx} record={record} index={idx} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 bg-white border-b z-10">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        Test History <span className="text-gray-400 font-normal">|</span> {user.firstName || user.username || user.email}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="pre" className="flex-1 overflow-hidden flex flex-col items-stretch">
                    <div className="px-6 pt-4 bg-gray-50/50 border-b shrink-0">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="pre">Pre-Test ({preTests.length})</TabsTrigger>
                            <TabsTrigger value="post">Post-Test ({postTests.length})</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-white">
                        <TabsContent value="pre" className="m-0 focus-visible:outline-none">
                            {renderTestList(preTests)}
                        </TabsContent>
                        <TabsContent value="post" className="m-0 focus-visible:outline-none">
                            {renderTestList(postTests)}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default UserTestResultModal;
