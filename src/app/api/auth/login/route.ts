import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { createSessionToken, AgentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // Call Supabase RPC verify_agent_login server-side
    const { data, error } = await supabase.rpc('verify_agent_login', {
      p_username: username.trim(),
      p_password: String(password)
    });

    if (error) {
      console.error('Login RPC error:', error);
      return NextResponse.json(
        { success: false, error: 'Database authentication service error.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    const agent: AgentUser = data[0];
    const token = createSessionToken(agent);

    const cookieStore = await cookies();
    cookieStore.set('wipa_agent_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({
      success: true,
      agent
    });
  } catch (err: any) {
    console.error('Login handler error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
