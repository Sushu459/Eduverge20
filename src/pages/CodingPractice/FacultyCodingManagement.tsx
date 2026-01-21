import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { CodingQuestion } from '../../utils/codingLabService'
import { Plus, CheckCircle, AlertCircle, Clock, Trash2, Lock, AlertTriangle } from 'lucide-react'
import { Code2 } from 'lucide-react';

// ==========================================
// 1. ADD THIS CUSTOM MODAL COMPONENT
// ==========================================
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, itemName, isDeleting 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Icon Header */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="bg-red-50 p-3 rounded-full mb-3">
             <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          <p className="text-gray-500 mb-2">
            {message} {itemName && <span className="font-semibold text-gray-800">"{itemName}"</span>}?
          </p>
          
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-4 text-left flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              This action will permanently delete this item. This cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
               <>Deleting...</>
            ) : (
               <><Trash2 className="w-4 h-4" /> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

interface FacultyCodingManagementProps {
  user: any
}

interface CodingSubmission {
  id: string
  student_id: string
  student_name: string
  code: string
  status: string
  output: string
  tests_passed: number
  total_tests: number
  submitted_at: string
}

interface HiddenTestCase {
  id: string
  question_id: string
  input: string
  expected_output: string
  test_number: number
  is_active: boolean
  created_at: string
}

const FacultyCodingManagement: React.FC<FacultyCodingManagementProps> = ({ user }) => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CodingQuestion | null>(null)
  
  // 2. NEW STATE FOR DELETE MODAL
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '' as 'question' | 'test' | 'submission', // To know what we are deleting
    id: '',
    title: '',
    itemName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    programming_language: 'python',
    sample_input: '',
    sample_output: '',
    sample_input2: '',
    sample_output2: '',
    time_limit: 5,
    memory_limit: 256,
    is_published: false,
  })

  // ===== SUBMISSIONS STATES =====
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<CodingSubmission | null>(null)

  // ===== HIDDEN TEST CASES STATES =====
  const [showHiddenTestsModal, setShowHiddenTestsModal] = useState(false)
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [hiddenTests, setHiddenTests] = useState<HiddenTestCase[]>([])
  const [hiddenTestsCount, setHiddenTestsCount] = useState<Record<string, number>>({})
  const [addingTest, setAddingTest] = useState(false)
  const [newTestData, setNewTestData] = useState({
    input: '',
    expected_output: '',
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('faculty_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])

      if (data && data.length > 0) {
        const problemIds = data.map(p => p.id)
        const { data: submissionData } = await supabase
          .from('coding_submissions')
          .select('question_id')
          .in('question_id', problemIds)

        const counts: Record<string, number> = {}
        submissionData?.forEach(sub => {
          counts[sub.question_id] = (counts[sub.question_id] || 0) + 1
        })
        setSubmissionCounts(counts)

        const { data: hiddenTestData } = await supabase
          .from('hidden_test_cases')
          .select('question_id')
          .in('question_id', problemIds)

        const testCounts: Record<string, number> = {}
        hiddenTestData?.forEach(test => {
          testCounts[test.question_id] = (testCounts[test.question_id] || 0) + 1
        })
        setHiddenTestsCount(testCounts)
      }
    } catch (err) {
      console.error('❌ Error fetching questions:', err)
    }
  }

  // ===== HIDDEN TEST CASES FUNCTIONS =====
  const fetchHiddenTests = async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('hidden_test_cases')
        .select('*')
        .eq('question_id', problemId)
        .order('test_number', { ascending: true })

      if (error) throw error
      setHiddenTests(data || [])
      setSelectedProblemId(problemId)
      setShowHiddenTestsModal(true)
    } catch (error) {
      console.error('❌ Error fetching hidden tests:', error)
    }
  }

  const addHiddenTest = async () => {
    if (!selectedProblemId || !newTestData.input || !newTestData.expected_output) {
      alert('Please fill in both input and expected output') // You can change this to toast later
      return
    }

    try {
      const testNumber = hiddenTests.length + 1
      const { data, error } = await supabase
        .from('hidden_test_cases')
        .insert([
          {
            question_id: selectedProblemId,
            input: newTestData.input,
            expected_output: newTestData.expected_output,
            test_number: testNumber,
            is_active: true,
            faculty_id: user?.id,
          },
        ])
        .select()

      if (error) throw error
      
      setHiddenTests([...hiddenTests, data[0]])
      setNewTestData({ input: '', expected_output: '' })
      setAddingTest(false)
      fetchQuestions() 
    } catch (error) {
      console.error('❌ Error adding hidden test:', error)
      alert('Failed to add test case')
    }
  }

  // 3. UPDATED: CONFIRM DELETE TEST
  const confirmDeleteHiddenTest = (testId: string) => {
     setDeleteModal({
        isOpen: true,
        type: 'test',
        id: testId,
        title: 'Delete Test Case',
        itemName: 'Test Case #' + (hiddenTests.find(t => t.id === testId)?.test_number || '')
     })
  }

  // 4. UPDATED: EXECUTE DELETE TEST (Logic moved here)
  const executeDeleteHiddenTest = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('hidden_test_cases')
        .delete()
        .eq('id', deleteModal.id)

      if (error) throw error
      
      setHiddenTests(hiddenTests.filter(t => t.id !== deleteModal.id))
      fetchQuestions()
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (error) {
      console.error('❌ Error deleting hidden test:', error)
    } finally {
      setIsDeleting(false);
    }
  }

  const toggleTestActive = async (testId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hidden_test_cases')
        .update({ is_active: !currentStatus })
        .eq('id', testId)

      if (error) throw error
      
      setHiddenTests(hiddenTests.map(t => 
        t.id === testId ? { ...t, is_active: !currentStatus } : t
      ))
    } catch (error) {
      console.error('❌ Error updating test:', error)
    }
  }

  // ===== SUBMISSIONS FUNCTIONS =====
  const fetchSubmissions = async (problemId: string) => {
    try {
      const { data } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('question_id', problemId)
        .order('submitted_at', { ascending: false })

      if (data && data.length > 0) {
        const studentIds = data.map(d => d.student_id)
        const { data: studentData } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', studentIds)

        const studentMap = new Map(studentData?.map(s => [s.id, s.full_name]) || [])

        const submissionsWithNames = data.map(sub => ({
          ...sub,
          student_name: studentMap.get(sub.student_id) || 'Unknown Student',
        }))

      setSubmissions(submissionsWithNames)
      } else {
        setSubmissions([])
      }

      setShowSubmissionsModal(true)
    } catch (error) {
      console.error('❌ Error fetching submissions:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Accepted
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <AlertCircle className="w-4 h-4" />
            Error
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Running
          </span>
        )
    }
  }

  // 5. UPDATED: CONFIRM DELETE SUBMISSION
  const confirmDeleteSubmission = (submissionId: string) => {
      setDeleteModal({
          isOpen: true,
          type: 'submission',
          id: submissionId,
          title: 'Delete Submission',
          itemName: 'Student Submission'
      })
  }

  // 6. UPDATED: EXECUTE DELETE SUBMISSION
  const executeDeleteSubmission = async () => {
    setIsDeleting(true);
    try {
      await supabase
        .from('coding_submissions')
        .delete()
        .eq('id', deleteModal.id)

      setSubmissions(submissions.filter(s => s.id !== deleteModal.id))
      fetchQuestions()
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (error) {
      console.error('❌ Error deleting submission:', error)
    } finally {
        setIsDeleting(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const { error } = await supabase
          .from('coding_questions')
          .update(formData)
          .eq('id', editing.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('coding_questions').insert([
          {
            ...formData,
            faculty_id: user?.id,
          },
        ])

        if (error) throw error
      }

      setFormData({
        title: '',
        description: '',
        difficulty: 'medium',
        programming_language: 'python',
        sample_input: '',
        sample_output: '',
        sample_input2: '',
        sample_output2: '',
        time_limit: 5,
        memory_limit: 256,
        is_published: false,
      })
      setEditing(null)
      setShowForm(false)
      fetchQuestions()
    } catch (err) {
      console.error('❌ Error saving question:', err)
    }
  }

  // 7. UPDATED: CONFIRM DELETE PROBLEM
  const confirmDeleteQuestion = (id: string, title: string) => {
    setDeleteModal({
        isOpen: true,
        type: 'question',
        id: id,
        title: 'Delete Problem',
        itemName: title
    })
  }

  // 8. UPDATED: EXECUTE DELETE PROBLEM
  const executeDeleteQuestion = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('coding_questions').delete().eq('id', deleteModal.id)
      if (error) throw error
      fetchQuestions()
      setDeleteModal({ ...deleteModal, isOpen: false });
    } catch (err) {
      console.error('❌ Error deleting question:', err)
    } finally {
        setIsDeleting(false);
    }
  }

  // 9. HANDLE ALL DELETIONS VIA MODAL
  const handleModalConfirm = () => {
      if (deleteModal.type === 'question') executeDeleteQuestion();
      if (deleteModal.type === 'test') executeDeleteHiddenTest();
      if (deleteModal.type === 'submission') executeDeleteSubmission();
  }

  const handleEdit = (question: CodingQuestion) => {
    setEditing(question)
    setFormData({
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      programming_language: question.programming_language,
      sample_input: question.sample_input,
      sample_output: question.sample_output,
      sample_input2: question.sample_input2,
      sample_output2: question.sample_output2,
      time_limit: question.time_limit,
      memory_limit: question.memory_limit,
      is_published: question.is_published,
    })
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
        {/* 10. ADDED: Render the Custom Delete Modal */}
        <DeleteConfirmationModal 
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
            onConfirm={handleModalConfirm}
            title={deleteModal.title}
            message="Are you sure you want to delete"
            itemName={deleteModal.itemName}
            isDeleting={isDeleting}
        />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
                <Code2 className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-teal-700 to-slate-800 bg-clip-text text-transparent">
            Coding Problem Management
            </h1>
          </div>

          <button
            onClick={() => {
              setEditing(null)
              setFormData({
                title: '',
                description: '',
                difficulty: 'medium',
                programming_language: 'python',
                sample_input: '',
                sample_output: '',
                sample_input2: '',
                sample_output2: '',
                time_limit: 5,
                memory_limit: 256,
                is_published: false,
              })
              setShowForm(true)
              }}
              className="
              w-full sm:w-auto
              flex items-center justify-center gap-2
              px-5 py-2.5
              bg-gradient-to-r from-purple-700 to-emerald-400
              text-white font-semibold
              rounded-lg
              shadow-md
              hover:from-purple-800 hover:to-emerald-600
              hover:shadow-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            <Plus className="w-5 h-5" />
            Create Problem
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editing ? 'Edit Problem' : 'Create New Problem'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="col-span-2 p-2 border rounded"
                  required
                />
                
                {/* ... (Rest of your form inputs remain unchanged) ... */}
                <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="p-2 border rounded"
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>

                <select
                    value={formData.programming_language}
                    onChange={(e) =>
                    setFormData({ ...formData, programming_language: e.target.value })
                    }
                    className="p-2 border rounded"
                >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                </select>

                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-2 p-2 border rounded"
                  required
                />
                
                {/* Simplified inputs for brevity in this response (keep your original ones) */}
                 <textarea placeholder="Sample Input 1" value={formData.sample_input} onChange={(e) => setFormData({ ...formData, sample_input: e.target.value })} className="p-2 border rounded" />
                 <textarea placeholder="Sample Output 1" value={formData.sample_output} onChange={(e) => setFormData({ ...formData, sample_output: e.target.value })} className="p-2 border rounded" />
                 <textarea placeholder="Sample Input 2" value={formData.sample_input2} onChange={(e) => setFormData({ ...formData, sample_input2: e.target.value })} className="p-2 border rounded" />
                 <textarea placeholder="Sample Output 2" value={formData.sample_output2} onChange={(e) => setFormData({ ...formData, sample_output2: e.target.value })} className="p-2 border rounded" />
                 <input type="number" placeholder="Time Limit" value={formData.time_limit} onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })} className="p-2 border rounded" />
                 <input type="number" placeholder="Memory Limit" value={formData.memory_limit} onChange={(e) => setFormData({ ...formData, memory_limit: parseInt(e.target.value) })} className="p-2 border rounded" />

              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <span>Publish for Students</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editing ? 'Update' : 'Create'} Problem
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">

  {/* ================= DESKTOP TABLE ================= */}
  <div className="hidden md:block">
    <table className="w-full">
      <thead className="bg-gray-200">
        <tr>
          <th className="p-4 text-left">Title</th>
          <th className="p-4 text-left">Difficulty</th>
          <th className="p-4 text-left">Language</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-left">Submissions</th>
          <th className="p-4 text-left">Hidden Tests</th>
          <th className="p-4 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {questions.map((q) => (
          <tr key={q.id} className="border-t hover:bg-gray-50">
            <td className="p-4 font-medium">{q.title}</td>

            <td className="p-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {q.difficulty}
              </span>
            </td>

            <td className="p-4">{q.programming_language}</td>
            <td className="p-4">{q.is_published ? '✅ Published' : '⭕ Draft'}</td>

            <td className="p-4 text-blue-600 font-semibold">
              {submissionCounts[q.id] || 0}
            </td>

            <td className="p-4 flex items-center gap-1.5 text-purple-600 font-semibold">
              <Lock className="w-4 h-4" />
              {hiddenTestsCount[q.id] || 0}
            </td>

            <td className="p-4 align-middle">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button
                onClick={() => fetchHiddenTests(q.id)}
               className="px-3 py-1 gap-1.5 bg-purple-500 text-white rounded text-sm">
              
                Tests
              </button>
              <button
                onClick={() => fetchSubmissions(q.id)}
                className="px-3 py-1 gap-1.5 bg-green-500 text-white rounded text-sm"
              >
                View
              </button>
              <button
                onClick={() => handleEdit(q)}
                className="px-3 py-1 gap-1.5 bg-blue-500 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                // 11. UPDATED: Call custom modal function
                onClick={() => confirmDeleteQuestion(q.id, q.title)}
                className="px-3 py-1 gap-1.5 bg-red-500 text-white rounded text-sm"
              >
                Delete
              </button>
              </div>
            </td>

          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* ================= MOBILE CARDS ================= */}
  <div className="md:hidden space-y-4 p-4">
    {questions.map((q) => (
      <div
        key={q.id}
        className="border rounded-xl p-4 shadow-sm space-y-3"
      >
        {/* ... (Mobile card content same as before) ... */}
        <div className="flex flex-wrap gap-2 pt-2">
            {/* ... other buttons ... */}
            <button
            // 11. UPDATED: Call custom modal function
            onClick={() => confirmDeleteQuestion(q.id, q.title)}
            className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm"
            >
            Delete
            </button>
        </div>
      </div>
    ))}
  </div>
</div>

      </div>

      {/* ===== HIDDEN TESTS MODAL ===== */}
      {showHiddenTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-96 overflow-y-auto">
            {/* ... (Modal Header) ... */}
             <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Hidden Test Cases
                </h3>
              </div>
              <button onClick={() => setShowHiddenTestsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Existing Hidden Tests */}
              {hiddenTests.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Test Cases ({hiddenTests.length})</h4>
                  {hiddenTests.map((test, idx) => (
                    <div key={test.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-800">Test {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          {/* ... checkbox ... */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={test.is_active} onChange={() => toggleTestActive(test.id, test.is_active)} className="w-4 h-4" />
                            <span className="text-sm text-gray-600">Active</span>
                          </label>
                          <button
                            // 12. UPDATED: Call custom modal function
                            onClick={() => confirmDeleteHiddenTest(test.id)}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {/* ... inputs/outputs display ... */}
                      <div className="grid grid-cols-2 gap-3">
                         <div><pre className="bg-white p-2 rounded border">{test.input}</pre></div>
                         <div><pre className="bg-white p-2 rounded border">{test.expected_output}</pre></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hidden test cases yet.</div>
              )}

              {/* ... (Add Test Form) ... */}
               {!addingTest ? (
                <button onClick={() => setAddingTest(true)} className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Add Test Case
                </button>
              ) : (
                <div className="border rounded-lg p-4 bg-purple-50">
                   {/* ... add test form inputs ... */}
                   <textarea placeholder="Input" value={newTestData.input} onChange={(e) => setNewTestData({ ...newTestData, input: e.target.value })} className="w-full p-2 border rounded font-mono text-sm" rows={3} />
                   <textarea placeholder="Expected Output" value={newTestData.expected_output} onChange={(e) => setNewTestData({ ...newTestData, expected_output: e.target.value })} className="w-full p-2 border rounded font-mono text-sm mt-2" rows={3} />
                   <div className="flex gap-2 mt-2">
                      <button onClick={addHiddenTest} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
                      <button onClick={() => setAddingTest(false)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ===== SUBMISSIONS MODAL ===== */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
             <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Student Submissions</h3>
              <button onClick={() => setShowSubmissionsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No submissions yet</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {submissions.map(submission => (
                  <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                       {/* ... name and date ... */}
                       <div>
                          <p className="font-semibold text-gray-800">{submission.student_name}</p>
                          <p className="text-sm text-gray-500">{new Date(submission.submitted_at).toLocaleString()}</p>
                       </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(submission.status)}
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View Code
                        </button>
                        <button
                          // 13. UPDATED: Call custom modal function
                          onClick={() => confirmDeleteSubmission(submission.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                     {/* ... stats ... */}
                     <p className="text-sm text-gray-600">Tests Passed: {submission.tests_passed}/{submission.total_tests}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CODE VIEWER MODAL ===== */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
             <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-800">Code Submission</h3>
              <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>
            <div className="p-6">
               <pre className="bg-gray-50 p-4 rounded border text-sm overflow-x-auto"><code>{selectedSubmission.code}</code></pre>
               {selectedSubmission.output && <div className="p-4 bg-blue-50 border border-blue-200 rounded mt-4"><pre className="text-sm text-blue-800">{selectedSubmission.output}</pre></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyCodingManagement