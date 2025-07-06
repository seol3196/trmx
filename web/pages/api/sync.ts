import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';

/**
 * 페이지 언로드 시 동기화를 처리하는 API 엔드포인트
 * 
 * navigator.sendBeacon()을 통해 호출되며, 백그라운드에서 동기화 작업을 수행합니다.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    // 요청 본문에서 동기화할 데이터 가져오기
    const syncData = req.body;
    
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 동기화 작업 수행
    if (syncData && Array.isArray(syncData.items)) {
      for (const item of syncData.items) {
        if (item.operation === 'create') {
          // 기록 생성
          await supabase.from('notes').insert({
            id: item.data.id,
            student_id: item.data.studentId,
            card_id: item.data.cardId,
            content: item.data.memo,
            subject: item.data.subject,
            recorded_date: item.data.recordedDate,
            created_by: user.id
          });
        } else if (item.operation === 'delete') {
          // 기록 삭제
          await supabase.from('notes').delete().eq('id', item.data.id);
        }
      }
    }
    
    // 성공 응답
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('동기화 처리 중 오류:', error);
    
    // 오류 응답
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 