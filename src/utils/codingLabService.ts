
import axiosClient from './axiosClient'
import { supabase } from './supabaseClient'

// ============================================================================
// TYPES
// ============================================================================

export interface CodingQuestion {
  id: string
  faculty_id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  programming_language: string
  sample_input: string
  sample_output: string
  time_limit: number
  memory_limit: number
  is_published: boolean
  created_at: string
}

export interface TestCase {
  input: string
  expectedOutput: string
}

export interface ExecutionResult {
  status: 'accepted' | 'error' | 'runtime_error' | 'timeout'
  output: string
  error: string | null
  executionTime: number
  memoryUsed: number
  testsPassed: number
  totalTests: number
}

export interface CodingSubmission {
  id: string
  question_id: string
  student_id: string
  code: string
  language: string
  status: 'accepted' | 'error' | 'pending'
  output: string
  error_message: string | null
  execution_time: number
  memory_used: number
  tests_passed: number
  total_tests: number
  submitted_at: string
}

// ============================================================================
// DATABASE SERVICE
// ============================================================================

class CodingLabDatabaseService {
  static async getQuestion(questionId: string): Promise<CodingQuestion | null> {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('id', questionId)
        .single()

      if (error) throw error
      return data as CodingQuestion
    } catch (error) {
      console.error('❌ Error fetching question:', error)
      throw error
    }
  }

  static async getPublishedQuestions(): Promise<CodingQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('coding_questions')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as CodingQuestion[]
    } catch (error) {
      console.error('❌ Error fetching questions:', error)
      return []
    }
  }

  static async saveSubmission(submission: Partial<CodingSubmission>): Promise<CodingSubmission> {
    try {
      const { data, error } = await supabase
        .from('coding_submissions')
        .insert([submission])
        .select()
        .single()

      if (error) throw error
      return data as CodingSubmission
    } catch (error) {
      console.error('❌ Error saving submission:', error)
      throw error
    }
  }

  static async getSubmission(submissionId: string): Promise<CodingSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('coding_submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (error) throw error
      return data as CodingSubmission
    } catch (error) {
      console.error('❌ Error fetching submission:', error)
      return null
    }
  }
}

// ============================================================================
// PISTON SERVICE (FREE - RECOMMENDED)
// ============================================================================

interface PistonResponse {
  run?: {
    stdout?: string
    stderr?: string
  }
}

class PistonService {
  private baseUrl = 'https://emkc.org/api/v2'

  async execute(code: string, language: string, testCases: TestCase[]): Promise<ExecutionResult> {
    try {
      const pistonLanguage = this.mapLanguage(language)
      const ext = this.getExtension(language)

      let testsPassed = 0

      for (const testCase of testCases) {
        try {
          const response = await axiosClient.post<PistonResponse>(
            `${this.baseUrl}/piston/execute`,
            {
              language: pistonLanguage,
              version: '*',
              files: [
                {
                  name: `solution.${ext}`,
                  content: code,
                },
              ],
              stdin: testCase.input,
              compile_timeout: 10000,
              run_timeout: 3000,
            }
          )

          const output = response?.data.run?.stdout?.trim() || ''
          if (output === testCase.expectedOutput.trim()) {
            testsPassed++
          }
        } catch (error) {
          console.error('❌ Test execution failed:', error)
        }
      }

      return {
        status: testsPassed === testCases.length ? 'accepted' : 'error',
        output: `${testsPassed}/${testCases.length} tests passed`,
        error: null,
        executionTime: 0,
        memoryUsed: 0,
        testsPassed,
        totalTests: testCases.length,
      }
    } catch (error) {
      console.error('❌ Piston execution failed:', error)
      throw error
    }
  }

  private mapLanguage(lang: string): string {
    const map: Record<string, string> = {
      python: 'python',
      python3: 'python',
      javascript: 'javascript',
      js: 'javascript',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
    }
    return map[lang.toLowerCase()] || 'python'
  }

  private getExtension(lang: string): string {
    const ext: Record<string, string> = {
      python: 'py',
    //  javascript: 'js',
      java: 'java',
     // cpp: 'cpp',
      c: 'c',
    //   csharp: 'cs',
    //   go: 'go',
    //   rust: 'rs',
    }
    return ext[lang.toLowerCase()] || 'py'
  }
}

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

export async function executeAndSaveCode(
  questionId: string,
  studentId: string,
  code: string,
  language: string
): Promise<CodingSubmission> {
  try {
    console.log('🚀 Executing code...')

    // 1. Fetch question with test cases
    const question = await CodingLabDatabaseService.getQuestion(questionId)
    if (!question) throw new Error('Question not found')

    const testCases: TestCase[] = []
    if (question.sample_input && question.sample_output) {
      testCases.push({
        input: question.sample_input,
        expectedOutput: question.sample_output,
      })
    }

    // 2. Execute code
    const executionService = new PistonService()
    const result = await executionService.execute(code, language, testCases)

    // 3. Save submission
    // Map ExecutionResult status to CodingSubmission status
    let submissionStatus: 'accepted' | 'error' | 'pending' | undefined;
    if (result.status === 'accepted') {
      submissionStatus = 'accepted';
    } else if (result.status === 'error' || result.status === 'runtime_error' || result.status === 'timeout') {
      submissionStatus = 'error';
    } else {
      submissionStatus = undefined;
    }

    const submission = await CodingLabDatabaseService.saveSubmission({
      question_id: questionId,
      student_id: studentId,
      code,
      language,
      status: submissionStatus,
      output: result.output,
      error_message: result.error,
      execution_time: result.executionTime,
      memory_used: result.memoryUsed,
      tests_passed: result.testsPassed,
      total_tests: result.totalTests,
      submitted_at: new Date().toISOString(),
    })

    console.log('✅ Submission saved:', submission.id)
    return submission
  } catch (error) {
    console.error('❌ Execution failed:', error)
    throw error
  }
}

export { CodingLabDatabaseService }