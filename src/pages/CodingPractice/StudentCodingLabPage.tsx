
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabaseClient'
import { executeAndSaveCode, CodingQuestion, CodingSubmission } from '../../utils/codingLabService'
import CodeEditor from './CodeEditor'

interface StudentCodingLabPageProps {
  user: any
}

const StudentCodingLabPage: React.FC<StudentCodingLabPageProps> = ({ user }) => {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([])
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')

  useEffect(() => {
    fetchQuestions()
    fetchSubmissions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (err) {
      console.error('❌ Error fetching questions:', err)
      setError('Failed to load questions')
    } finally {
    }
  }

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('student_id', user?.id)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (err) {
      console.error('❌ Error fetching submissions:', err)
    }
  }

  const handleSelectQuestion = (question: CodingQuestion) => {
    setSelectedQuestion(question)
    setCode('')
    setError(null)
  }

  const handleSubmitCode = async () => {
    if (!selectedQuestion || !code.trim()) {
      setError('Please write some code first')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const submission = await executeAndSaveCode(
        selectedQuestion.id,
        user.id,
        code,
        language
      )
      navigate(`/submission/${submission.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredQuestions = questions.filter(q => {
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    if (filterLanguage !== 'all' && q.programming_language !== filterLanguage) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📝 Coding Practice Lab</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-bold mb-4">Problems ({filteredQuestions.length})</h2>

              {/* Filters */}
              <div className="mb-4 space-y-2">
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="all">All Languages</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                </select>
              </div>

              {/* Questions */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredQuestions.map(q => {
                  const submitted = submissions.some(s => s.question_id === q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      className={`w-full p-2 text-left rounded ${
                        selectedQuestion?.id === q.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 border'
                      } hover:bg-gray-200`}
                    >
                      <div className="font-semibold text-sm">{q.title}</div>
                      <div className="text-xs text-gray-600">
                        {q.difficulty} • {submitted ? '✅ Submitted' : '⭕ Not started'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Editor & Submission */}
          <div className="lg:col-span-2">
            {selectedQuestion ? (
              <div className="space-y-4">
                {/* Problem Details */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-2xl font-bold">{selectedQuestion.title}</h2>
                  <p className="text-gray-600 mt-2">{selectedQuestion.description}</p>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="p-2 bg-blue-100 rounded">
                      <strong>Difficulty:</strong> {selectedQuestion.difficulty}
                    </div>
                    <div className="p-2 bg-green-100 rounded">
                      <strong>Language:</strong> {selectedQuestion.programming_language}
                    </div>
                    <div className="p-2 bg-purple-100 rounded">
                      <strong>Time Limit:</strong> {selectedQuestion.time_limit}s
                    </div>
                  </div>
                </div>

                {/* Editor */}
                <CodeEditor
                  code={code}
                  setCode={setCode}
                  language={language}
                  setLanguage={setLanguage}
                />

                {/* Error */}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmitCode}
                  disabled={submitting || !code.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                >
                  {submitting ? '⏳ Submitting...' : '🚀 Submit Solution'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 text-lg">Select a problem to start coding</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentCodingLabPage