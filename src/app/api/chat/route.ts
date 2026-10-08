import { NextResponse } from 'next/server';
import { processUserChatMessage } from '@/lib/aiChatEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userQuery, messages, restaurantContext, userReservationsContext } = body;

    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json(
        { error: 'User query is required and must be a string' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

    // Local smart NLP engine fallback response
    const localResponse = processUserChatMessage(userQuery);

    if (apiKey) {
      try {
        const systemPrompt = `You are QueueBite Assistant, an AI restaurant booking and food ordering assistant.
Help users understand QueueBite, restaurants, tables, menu items, food pre-ordering, reservations, queue wait times, and QR check-in.
Use available application data when answering. Never invent unavailable information.
If an action requires the existing QueueBite booking/order system, guide the user to the appropriate existing flow rather than creating a separate system.

Context Data:
${restaurantContext ? `Selected Restaurant: ${JSON.stringify(restaurantContext)}` : ''}
${userReservationsContext ? `User Reservations: ${JSON.stringify(userReservationsContext)}` : ''}

Key QueueBite Policies:
1. Pre-ordering food during booking saves 10% off cart total.
2. QR Code is generated upon confirmation and scanned by staff at entrance for instant check-in.
3. Live Walk-in Queue allows walk-in guests to get a live token with estimated wait times.
4. Active Promo Codes: PREORDER10 (10% off pre-orders), FEAST100 (₹100 off above ₹799), FREEBEV (free beverage above ₹600).

Be friendly, concise, polite, and format your output with clean markdown bullet points and bold text.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemPrompt },
                    { text: `User Query: ${userQuery}` },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const aiText =
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text || localResponse.text;

          return NextResponse.json({
            text: aiText,
            actionCard: localResponse.actionCard, // Attach relevant action card if detected
          });
        }
      } catch {
        // Fallback to local NLP on API error
      }
    }

    // Default to local smart NLP engine
    return NextResponse.json(localResponse);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process chat message', details: String(error) },
      { status: 500 }
    );
  }
}
