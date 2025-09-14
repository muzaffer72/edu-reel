import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { postId, content, imageUrl } = await req.json();

    if (!postId || !content) {
      return new Response(
        JSON.stringify({ error: 'Post ID and content are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing AI response for post:', postId);

    // Create AI user if it doesn't exist
    const AI_USER_ID = '00000000-0000-0000-0000-000000000001';
    
    // Check if AI user profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', AI_USER_ID)
      .single();

    if (!existingProfile) {
      // Insert AI user profile
      await supabase.from('profiles').insert({
        user_id: AI_USER_ID,
        display_name: 'AI Asistan',
        bio: 'Sınav sorularınıza AI destekli yanıtlar veren asistan.',
        exam_categories: {}
      });
    }

    // Prepare the prompt for Gemini
    let prompt = `Sen bir eğitim asistanısın. Aşağıdaki sınav sorusu veya eğitim içeriğine detaylı, açıklayıcı ve yardımcı bir yanıt ver. Yanıtın Türkçe olsun ve öğrencinin konuyu anlamasına yardımcı olacak şekilde olsun.\n\nİçerik: ${content}`;

    // If there's an image, mention it in the prompt
    if (imageUrl) {
      prompt += `\n\nNot: Bu içerikte bir görsel de bulunmaktadır. Gerekiyorsa görselle ilgili açıklama da yapabilirsin.`;
    }

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);

    const aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      throw new Error('No response generated from Gemini API');
    }

    // Create AI comment
    const { error: commentError } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: AI_USER_ID,
      content: aiResponseText,
      proposed_as_correct: false
    });

    if (commentError) {
      console.error('Error creating AI comment:', commentError);
      throw new Error('Failed to create AI comment');
    }

    console.log('AI response created successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      aiResponse: aiResponseText 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-response function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});