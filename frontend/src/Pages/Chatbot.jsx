import { useState, useRef, useEffect } from 'react';
import ChatHeader from '../Components/Chatbot/ChatHeader';
import WelcomeScreen from '../Components/Chatbot/WelcomeScreen';
import ChatScreen from '../Components/Chatbot/ChatScreen';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const patientName = "Kanchana";

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==================== FREE AI RESPONSES ====================

  const getGroqResponse = async (userMessage) => {
    const GROQ_API_KEY = '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'; // Add to .env: REACT_APP_GROQ_API_KEY=your_key
    if (!GROQ_API_KEY) throw new Error('Groq key not configured');

    const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

    const medicalPrompt = `You are a helpful, cautious medical assistant. 
Your goal is to provide accurate, educational health information based on general knowledge.
- Always start with empathy and clarity.
- Never diagnose, prescribe medication, or give personalized treatment plans.
- Strongly recommend consulting a qualified healthcare professional.
- Keep responses concise yet informative (max 300-400 words).
- Use bullet points for clarity when helpful.

User question: ${userMessage}

End every response with this disclaimer:
⚠️ This is general educational information only and not medical advice. Please consult a doctor or healthcare professional for any health concerns.`;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // or 'llama-3.1-8b-instant' for higher limits
        messages: [{ role: 'user', content: medicalPrompt }],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  };

  const getHuggingFaceResponse = async (userMessage) => {
    // Replace with a better free medical-friendly model if available
    const HF_API_KEY = process.env.REACT_APP_HF_API_KEY || '';
    const HF_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-large'; // or a better one like "medalpaca/medalpaca-7b" if supported in free tier

    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Medical assistant: Provide safe, educational info only. Always advise seeing a doctor. Question: ${userMessage}`,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.7,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) throw new Error('Hugging Face API failed');

    const data = await response.json();
    let reply = Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
    return reply || 'I could not generate a detailed response right now.';
  };

  // Enhanced intelligent fallback (works offline)
  const getFallbackResponse = (userMessage) => {
    const msg = userMessage.toLowerCase().trim();

    const keywordResponses = {
      fever: "Fever is a common sign your body is fighting something, often an infection. \n• Rest, hydrate well, and monitor your temperature.\n• Over-the-counter paracetamol/acetaminophen can help with discomfort (follow dosage instructions).\n• Seek medical help if fever > 103°F (39.4°C), lasts >3 days, or you have severe symptoms.\n\n⚠️ This is general information only. Consult a doctor for proper diagnosis and care.",
      
      headache: "Headaches have many causes including stress, dehydration, lack of sleep, or tension. \n• Drink water, rest in a quiet dark room, and try a cold/warm compress.\n• Gentle neck stretches or over-the-counter pain relief may help.\n• See a doctor if headaches are sudden, severe, or come with vision changes, vomiting, or confusion.\n\n⚠️ This is not medical advice.",
      
      cough: "Coughing clears your airways and can be due to colds, allergies, or irritants. \n• Stay hydrated and use honey in warm tea (for adults).\n• Humidifier or saline nasal spray can soothe.\n• Seek care if cough lasts >2 weeks, has blood, or you have breathing difficulty.\n\n⚠️ Consult a healthcare professional if symptoms persist.",
      
      stomach: "Stomach discomfort can stem from diet, stress, or minor infections. \n• Try the BRAT diet (bananas, rice, applesauce, toast) and avoid spicy/greasy foods.\n• Stay hydrated with clear fluids.\n• See a doctor for severe pain, persistent vomiting, blood, or dehydration signs.\n\n⚠️ Always consult a professional for abdominal issues.",
    };

    for (const [key, response] of Object.entries(keywordResponses)) {
      if (msg.includes(key)) return response;
    }

    // Default for any other health query
    return `Thank you for sharing your health question about "${userMessage}". 

I can provide general educational information on common health topics, but I am not a doctor and cannot offer diagnoses or personalized medical advice.

Recommendations:
1. Describe your symptoms clearly to a qualified healthcare provider.
2. Visit a local clinic or use telehealth services if available in your area (Kandy has several good options).
3. Track symptoms (onset, severity, triggers) — this helps doctors.

Would you like general tips on a specific topic (e.g., hydration, sleep, first aid) or help finding nearby health resources?

⚠️ This information is for educational purposes only. Please consult a healthcare professional for any medical concerns.`;
  };

  const analyzeSymptoms = (message) => {
    const symptoms = {
      respiratory: ['cough', 'sneeze', 'breath', 'chest', 'lung', 'shortness', 'wheez'],
      digestive: ['stomach', 'nausea', 'vomit', 'diarrhea', 'constipation', 'belly', 'abdominal'],
      neurological: ['headache', 'dizzy', 'migraine', 'confusion', 'numb', 'seizure'],
      skin: ['rash', 'itch', 'redness', 'swelling', 'acne', 'burn'],
      general: ['fever', 'fatigue', 'pain', 'weak', 'tired', 'chills'],
    };

    for (const [category, keywords] of Object.entries(symptoms)) {
      if (keywords.some(kw => message.toLowerCase().includes(kw))) {
        return category;
      }
    }
    return null;
  };

  const simulateAIResponse = async (userMessage) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // realistic delay

    let reply = '';

    try {
      // Primary: Groq (fast + high quality, free tier)
      reply = await getGroqResponse(userMessage);
    } catch (groqError) {
      console.warn('Groq failed, trying Hugging Face...', groqError);
      try {
        // Secondary: Hugging Face
        reply = await getHuggingFaceResponse(userMessage);
      } catch (hfError) {
        console.warn('Hugging Face also failed, using local fallback', hfError);
        // Final local fallback (always works)
        const category = analyzeSymptoms(userMessage);
        reply = getFallbackResponse(userMessage);

        if (category) {
          const doctorMap = {
            respiratory: 'Pulmonologist or General Physician',
            digestive: 'Gastroenterologist',
            neurological: 'Neurologist',
            skin: 'Dermatologist',
            general: 'General Physician or Family Doctor',
          };
          reply += `\n\nBased on the symptoms described, consider consulting a **${doctorMap[category]}**. Would you like general tips for finding one in Kandy?`;
        }
      }
    }

    // Always append strong disclaimer
    const finalReply = reply.includes('Disclaimer') || reply.includes('consult') 
      ? reply 
      : reply + "\n\n⚠️ This is general educational information only and not a substitute for professional medical advice. Please consult a qualified healthcare provider.";

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      type: 'bot',
      text: finalReply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);

    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentMsg = inputValue;
    setInputValue('');

    await simulateAIResponse(currentMsg);
  };

  const handleSuggestionClick = (text) => {
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setTimeout(() => simulateAIResponse(text), 600);
  };

  // Welcome screen for first load
  if (messages.length === 0) {
    return (
      <WelcomeScreen
        patientName={patientName}
        onSuggestionClick={handleSuggestionClick}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSend={handleSendMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-2 pt-0">
      <div className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        <ChatHeader patientName={patientName} />
        <ChatScreen
          messages={messages}
          isTyping={isTyping}
          chatContainerRef={chatContainerRef}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default Chatbot;