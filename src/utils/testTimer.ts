// src/utils/testTimer.ts

import { supabase } from './supabaseClient';

export interface TestSession {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  duration_minutes: number;
  is_completed: boolean;
  created_at: string;
}

/**
 * Create or retrieve an existing test session with improved conflict handling
 * FIXED: Better handling of 409 Conflict errors with retry logic
 */
export const getOrCreateTestSession = async (
  assessmentId: string,
  durationMinutes: number
): Promise<TestSession> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // ✅ STEP 1: Always check if session already exists FIRST
    console.log('🔍 Checking for existing test session...');
    const { data: existingSession, error: fetchError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', user.id)
      .eq('is_completed', false)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If session exists and not completed, return it immediately
    if (existingSession) {
      console.log('✅ Existing active session found, resuming...');
      return existingSession;
    }

    console.log('📝 No existing session found, creating new one...');

    // ✅ STEP 2: Try to create new session
    let session: TestSession | null = null;
    let lastError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Creation attempt ${attempt}/3...`);

        const { data: newSession, error: createError } = await supabase
          .from('test_sessions')
          .insert([
            {
              assessment_id: assessmentId,
              student_id: user.id,
              started_at: new Date().toISOString(),
              duration_minutes: durationMinutes,
              is_completed: false,
            },
          ])
          .select('*')
          .single();

        if (createError) {
          lastError = createError;

          // 23505 = unique constraint violation / 409 = conflict
          if (
            createError.code === '23505' ||
            createError.details?.includes('duplicate')
          ) {
            console.warn(
              `⚠️ Attempt ${attempt}: Conflict detected (another request creating session)`
            );

            // Wait with exponential backoff before retry
            await new Promise(resolve =>
              setTimeout(resolve, 200 * Math.pow(2, attempt - 1))
            );

            // Retry fetching the session
            const {
              data: retriedSession,
              error: retryFetchError,
            } = await supabase
              .from('test_sessions')
              .select('*')
              .eq('assessment_id', assessmentId)
              .eq('student_id', user.id)
              .eq('is_completed', false)
              .maybeSingle();

            if (!retryFetchError && retriedSession) {
              console.log(
                `✅ Successfully retrieved session created by concurrent request`
              );
              return retriedSession;
            }

            // If retry also failed, continue loop to attempt creation again
            continue;
          }

          // Different error, throw it
          throw createError;
        }

        if (newSession) {
          console.log('✅ New test session created successfully');
          session = newSession;
          break;
        }
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        lastError = error;

        if (attempt < 3) {
          const backoffMs = 200 * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // ✅ STEP 3: If creation failed after retries, fetch the session one more time
    if (!session) {
      console.log(
        '🔍 Creation failed, attempting final session retrieval...'
      );
      const {
        data: finalSession,
        error: finalError,
      } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('student_id', user.id)
        .eq('is_completed', false)
        .maybeSingle();

      if (finalError) {
        throw finalError;
      }

      if (finalSession) {
        console.log('✅ Successfully retrieved session after retries');
        return finalSession;
      }

      // If we reach here, something went wrong
      throw lastError || new Error('Failed to create or retrieve test session');
    }

    return session;
  } catch (error: any) {
    console.error('❌ Fatal error in getOrCreateTestSession:', error);
    throw error;
  }
};

/**
 * Calculate remaining time based on server time (NOT client time)
 */
export const calculateRemainingTime = (session: TestSession): number => {
  try {
    const startTime = new Date(session.started_at).getTime();
    const durationMs = session.duration_minutes * 60 * 1000;
    const endTime = startTime + durationMs;
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);

    return Math.ceil(remaining / 1000);
  } catch (error) {
    console.error('Error calculating remaining time:', error);
    return 0;
  }
};

/**
 * Check if test time has expired
 */
export const isTimeExpired = (session: TestSession): boolean => {
  const remaining = calculateRemainingTime(session);
  return remaining <= 0;
};

/**
 * Mark test as completed
 */
export const completeTestSession = async (sessionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('test_sessions')
      .update({
        submitted_at: new Date().toISOString(),
        is_completed: true,
      })
      .eq('id', sessionId);

    if (error) {
      throw error;
    }

    console.log('✅ Test session marked as completed');
  } catch (error) {
    console.error('Error completing test session:', error);
    throw error;
  }
};

/**
 * Get all test sessions for an assessment (Faculty only)
 */
export const getAssessmentSessions = async (
  assessmentId: string
): Promise<TestSession[]> => {
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching assessment sessions:', error);
    throw error;
  }
};

/**
 * Get test session details for a specific student
 */
export const getStudentTestSession = async (
  assessmentId: string,
  studentId: string
): Promise<TestSession | null> => {
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching student test session:', error);
    throw error;
  }
};

/**
 * Get all sessions for current user (Student view)
 */
export const getMyTestSessions = async (): Promise<TestSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching my test sessions:', error);
    throw error;
  }
};

/**
 * Format seconds into readable time format
 */
export const formatTimeDisplay = (seconds: number): string => {
  if (seconds <= 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Get session statistics (for faculty dashboard)
 */
export const getSessionStats = (sessions: TestSession[]): {
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  averageSubmissionTime: string;
} => {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.is_completed).length;
  const pendingSessions = totalSessions - completedSessions;

  const submittedSessions = sessions.filter(
    s => s.submitted_at && s.is_completed
  );

  let averageSubmissionTime = '—';

  if (submittedSessions.length > 0) {
    const totalTime = submittedSessions.reduce((acc, session) => {
      const startTime = new Date(session.started_at).getTime();
      const submittedTime = new Date(session.submitted_at!).getTime();
      return acc + (submittedTime - startTime);
    }, 0);

    const avgTimeMs = totalTime / submittedSessions.length;
    const avgSeconds = Math.floor(avgTimeMs / 1000);
    averageSubmissionTime = formatTimeDisplay(avgSeconds);
  }

  return {
    totalSessions,
    completedSessions,
    pendingSessions,
    averageSubmissionTime,
  };
};

/**
 * Validate if a student can start the test
 */
export const validateTestAccess = async (
  assessmentId: string
): Promise<{ allowed: boolean; message: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { allowed: false, message: 'Please log in to take the test' };
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id')
      .eq('id', assessmentId)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return { allowed: false, message: 'Assessment not found' };
    }

    const { data: existingSession, error: sessionError } = await supabase
      .from('test_sessions')
      .select('is_completed')
      .eq('assessment_id', assessmentId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (sessionError) {
      return { allowed: false, message: 'Error checking test status' };
    }

    if (existingSession?.is_completed) {
      return {
        allowed: false,
        message: 'You have already completed this assessment',
      };
    }

    return { allowed: true, message: 'Access granted' };
  } catch (error) {
    console.error('Error validating test access:', error);
    return { allowed: false, message: 'Error validating access' };
  }
};
