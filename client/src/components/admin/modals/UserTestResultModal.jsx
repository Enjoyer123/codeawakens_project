import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from '@/components/shared/DataTableStates';


const UserTestResultModal = ({ open, onOpenChange, user, testHistory }) => {
    if (!user) return null;

    const preTests = testHistory.filter(t => t.test_type === 'PreTest');
    const postTests = testHistory.filter(t => t.test_type === 'PostTest');

    const renderTestTable = (tests) => {
        if (tests.length === 0) return <EmptyState message="No test data found." />;

        return (
            <div className="border rounded-md">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Question</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">User Answer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {tests.map((record, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 align-top">
                                    <div className="font-medium text-gray-900">{record.question}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Time: {new Date(record.answered_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <span className={record.is_correct ? "text-green-700" : "text-red-600 line-through"}>
                                        {record.user_choice}
                                    </span>
                                    {!record.is_correct && (
                                        <div className="text-xs text-green-600 mt-1">
                                            Correct: {record.correct_choice}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <Badge variant={record.is_correct ? "default" : "destructive"}>
                                        {record.is_correct ? "Correct" : "Wrong"}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Test Results: {user.username || user.email}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="pre" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList>
                        <TabsTrigger value="pre">Pre-Test ({preTests.length})</TabsTrigger>
                        <TabsTrigger value="post">Post-Test ({postTests.length})</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 mt-4">
                        <TabsContent value="pre" className="m-0 pr-4">
                            {renderTestTable(preTests)}
                        </TabsContent>
                        <TabsContent value="post" className="m-0 pr-4">
                            {renderTestTable(postTests)}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default UserTestResultModal;
