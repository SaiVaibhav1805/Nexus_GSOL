import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeDisruption(signal, shipment, allHubs) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build the graph context to send to Gemini
    const graphContext = {
        disruption: {
            type: signal.type,
            severity: signal.severity,
            location: signal.affectedHubId.name,
            description: signal.description
        },
        affectedShipment: {
            trackingId: shipment.trackingId,
            cargo: shipment.cargo.type,
            isPerishable: shipment.cargo.isPerishable,
            perishabilityIndex: shipment.cargo.perishabilityIndex,
            currentPath: shipment.activePath.map(h => ({
                name: h.name,
                type: h.type,
                status: h.status
            })),
            origin: shipment.origin,
            destination: shipment.destination,
            rippleScore: shipment.rippleScore
        },
        availableHubs: allHubs.map(h => ({
            name: h.name,
            type: h.type,
            status: h.status,
            healthScore: h.healthScore,
            location: h.location
        }))
    };

    const prompt = `
You are a Supply Chain Scientist analyzing a real-time logistics disruption.

Here is the current graph disruption data:
${JSON.stringify(graphContext, null, 2)}

Analyze this disruption and respond ONLY with a valid JSON object in exactly this format, no markdown, no explanation outside the JSON:

{
  "confidenceScore": <number 0-100 representing likelihood of shipment failure>,
  "explanation": "<2-3 sentence plain English explanation of the cascade effect and timeline>",
  "rerouteOptions": [
    {
      "rank": 1,
      "description": "<brief description of reroute>",
      "alternateHubs": ["<hub name>", "<hub name>"],
      "estimatedDelaySaved": "<time saved>",
      "riskLevel": "<low|medium|high>",
      "reasoning": "<why this route is better>"
    },
    {
      "rank": 2,
      "description": "<brief description of reroute>",
      "alternateHubs": ["<hub name>", "<hub name>"],
      "estimatedDelaySaved": "<time saved>",
      "riskLevel": "<low|medium|high>",
      "reasoning": "<why this route is better>"
    },
    {
      "rank": 3,
      "description": "<brief description of reroute>",
      "alternateHubs": ["<hub name>", "<hub name>"],
      "estimatedDelaySaved": "<time saved>",
      "riskLevel": "<low|medium|high>",
      "reasoning": "<why this route is better>"
    }
  ]
}
`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Strip markdown fences if Gemini wraps in ```json
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);

        return parsed;
    } catch (err) {
        if (err.message.includes('429')) {
            console.warn('Gemini rate limit hit — using fallback analysis');
        } else {
            console.error('Gemini analysis failed:', err.message);
        }
        return {
            confidenceScore: shipment.rippleScore,
            explanation: `${signal.type} at ${signal.affectedHubId.name} (severity ${signal.severity}/10) is directly impacting this ${shipment.cargo.type} shipment. Immediate rerouting recommended.`,
            rerouteOptions: [
                {
                    rank: 1,
                    description: 'Hold at origin and await clearance',
                    alternateHubs: [shipment.origin],
                    estimatedDelaySaved: '2-4 hours',
                    riskLevel: 'low',
                    reasoning: 'Safest option until disruption resolves'
                }
            ]
        };
    }
}