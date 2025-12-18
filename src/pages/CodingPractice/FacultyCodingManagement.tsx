import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { CodingQuestion } from '../../utils/codingLabService'
import { Eye, Edit2, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react'


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


const FacultyCodingManagement: React.FC<FacultyCodingManagementProps> = ({ user }) => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CodingQuestion | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    programming_language: 'python',
    sample_input: '',
    sample_output: '',
    time_limit: 5,
    memory_limit: 256,
    is_published: false,
  })

  // ===== NEW STATE FOR SUBMISSIONS =====
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
  // Removed unused selectedProblemId state
  const [selectedProblemTitle, setSelectedProblemTitle] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<CodingSubmission | null>(null)
  const [showCodeModal, setShowCodeModal] = useState(false)


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

      // ===== NEW: Fetch submission counts =====
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
      }
    } catch (err) {
      console.error('❌ Error fetching questions:', err)
    }
  }

  // ===== NEW: Fetch submissions for a problem =====
  const fetchSubmissions = async (problemId: string, problemTitle: string) => {
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

      setSelectedProblemTitle(problemTitle)
      setShowSubmissionsModal(true)
    } catch (error) {
      console.error('❌ Error fetching submissions:', error)
    }
  }

  // ===== NEW: Get status badge =====
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

  // ===== NEW: Delete submission =====
  const deleteSubmission = async (submissionId: string) => {
    if (confirm('Delete this submission?')) {
      try {
        await supabase
          .from('coding_submissions')
          .delete()
          .eq('id', submissionId)

        setSubmissions(submissions.filter(s => s.id !== submissionId))
        fetchQuestions() // Refresh counts
      } catch (error) {
        console.error('❌ Error deleting submission:', error)
      }
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return

    try {
      const { error } = await supabase.from('coding_questions').delete().eq('id', id)

      if (error) throw error
      fetchQuestions()
    } catch (err) {
      console.error('❌ Error deleting question:', err)
    }
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
      time_limit: question.time_limit,
      memory_limit: question.memory_limit,
      is_published: question.is_published,
    })
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📚 Coding Problem Management</h1>
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
                time_limit: 5,
                memory_limit: 256,
                is_published: false,
              })
              setShowForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
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

                <textarea
                  placeholder="Sample Input"
                  value={formData.sample_input}
                  onChange={(e) => setFormData({ ...formData, sample_input: e.target.value })}
                  className="p-2 border rounded"
                />

                <textarea
                  placeholder="Sample Output"
                  value={formData.sample_output}
                  onChange={(e) => setFormData({ ...formData, sample_output: e.target.value })}
                  className="p-2 border rounded"
                />

                <input
                  type="number"
                  placeholder="Time Limit (seconds)"
                  value={formData.time_limit}
                  onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                  className="p-2 border rounded"
                />

                <input
                  type="number"
                  placeholder="Memory Limit (MB)"
                  value={formData.memory_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, memory_limit: parseInt(e.target.value) })
                  }
                  className="p-2 border rounded"
                />
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
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Difficulty</th>
                <th className="p-4 text-left">Language</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Submissions</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{q.title}</td>
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
                  <td className="p-4">
                    {q.is_published ? '✅ Published' : '⭕ Draft'}
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-blue-600">
                      {submissionCounts[q.id] || 0}
                    </span>
                  </td>
                  <td className="p-4 space-x-2 flex items-center gap-2">
                    <button
                      onClick={() => fetchSubmissions(q.id, q.title)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(q)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== NEW: Submissions Modal ===== */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Student Submissions</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedProblemTitle}</p>
              </div>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No submissions yet for this problem
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {submissions.map(submission => (
                  <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{submission.student_name}</p>
                        <p className="text-sm text-gray-500">
                          Submitted {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(submission.status)}
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission)
                            setShowCodeModal(true)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View Code
                        </button>
                        <button
                          onClick={() => deleteSubmission(submission.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">
                        Tests Passed: <span className="font-semibold">{submission.tests_passed}/{submission.total_tests}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== NEW: Code Viewer Modal ===== */}
      {showCodeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-800">Code Submission - {selectedSubmission.student_name}</h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">📝 Code:</h4>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm overflow-x-auto">
                  <code>{selectedSubmission.code}</code>
                </pre>
              </div>
              {selectedSubmission.output && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">📤 Output:</h4>
                  <pre className="text-sm text-blue-800 overflow-x-auto">{selectedSubmission.output}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyCodingManagement