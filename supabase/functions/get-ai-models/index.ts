import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModelInfo {
  id: string;
  name: string;
  provider: 'openai' | 'google';
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider } = await req.json();
    
    let models: ModelInfo[] = [];

    if (provider === 'openai') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter to only include chat completion models
      const chatModels = data.data.filter((model: any) => 
        model.id.includes('gpt') || 
        model.id.includes('o1') || 
        model.id.includes('o3')
      );

      models = chatModels.map((model: any) => ({
        id: model.id,
        name: model.id,
        provider: 'openai',
        description: `OpenAI ${model.id}`
      }));

    } else if (provider === 'google') {
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Google AI models endpoint
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
      
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter to only include generative models
      const generativeModels = data.models?.filter((model: any) => 
        model.name.includes('gemini') || model.name.includes('gemma')
      ) || [];

      models = generativeModels.map((model: any) => ({
        id: model.name.split('/').pop(), // Extract model ID from full path
        name: model.displayName || model.name.split('/').pop(),
        provider: 'google',
        description: model.description || `Google ${model.displayName || model.name}`
      }));

      // Add some popular models if API doesn't return them
      const popularModels = [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', description: 'Fast and versatile performance' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', description: 'Complex reasoning and advanced capabilities' },
        { id: 'gemma-2-2b', name: 'Gemma 2 2B', provider: 'google', description: 'Lightweight open model' },
        { id: 'gemma-2-9b', name: 'Gemma 2 9B', provider: 'google', description: 'Balanced performance open model' },
        { id: 'gemma-2-27b', name: 'Gemma 2 27B', provider: 'google', description: 'Large open model' }
      ];

      // Add popular models if not already included
      popularModels.forEach(popularModel => {
        if (!models.find(m => m.id === popularModel.id)) {
          models.push(popularModel as ModelInfo);
        }
      });
    }

    return new Response(JSON.stringify({ models }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching AI models:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      models: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});