import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CasePhase, PatientChartData, SimulationResponse, Message, PerformanceMetrics } from './types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.STRING,
      description: "Detailed clinical feedback. Use Markdown.",
    },
    chartUpdates: {
      type: Type.OBJECT,
      description: "New information for the chart.",
      properties: {
        demographics: { type: Type.STRING },
        hpi: { type: Type.STRING },
        imaging: { type: Type.ARRAY, items: { type: Type.STRING } },
        pathology: { type: Type.ARRAY, items: { type: Type.STRING } },
        staging: { type: Type.STRING },
        comorbidities: { type: Type.STRING },
        labs: { type: Type.STRING }
      }
    },
    nextPhase: {
      type: Type.STRING,
      enum: [
        CasePhase.Vignette,
        CasePhase.Imaging,
        CasePhase.Pathology,
        CasePhase.Staging,
        CasePhase.Planning,
        CasePhase.PeerReview,
        CasePhase.Completed
      ]
    },
    questionToResident: {
      type: Type.STRING,
      description: "The next question to ask the resident."
    },
    performanceUpdate: {
      type: Type.OBJECT,
      description: "Update the resident's performance metrics based on the LATEST turn.",
      properties: {
        clinicalReasoning: { type: Type.NUMBER, description: "0-100 score on reasoning" },
        guidelineAdherence: { type: Type.NUMBER, description: "0-100 score on NCCN/ASTRO adherence" },
        safetyAwareness: { type: Type.NUMBER, description: "0-100 score on OAR/toxicities" },
        guidelinesCited: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific guidelines referenced/violated this turn" },
        improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific concepts to improve" }
      }
    },
    peerPlans: {
      type: Type.ARRAY,
      description: "Generate 2 simulated peer plans ONLY when transitioning to PeerReview phase.",
      items: {
        type: Type.OBJECT,
        properties: {
          residentName: { type: Type.STRING },
          plan: { type: Type.STRING },
          rationale: { type: Type.STRING }
        },
        required: ["residentName", "plan", "rationale"]
      }
    },
    visualDescription: {
      type: Type.STRING,
      description: "A highly precise, surgical-grade anatomical description for the medical illustrator. MUST SPECIFY: 1) Orientation (e.g. 'Sagittal view of the pelvis', 'Axial CT-corresponding anatomy'). 2) Specific anatomical landmarks (muscles, bones, vessels) to ground the image. 3) The pathology's exact color, texture, and relationship to these landmarks (e.g., 'lobulated mass invading the pterygoid plates'). 4) Style cue: 'in the style of Netter Atlas'. 5) **PLANNING PHASE RULE**: If the resident mentions specific OARs, YOU MUST GENERATE A NEW DESCRIPTION depicting the tumor's spatial relationship (abutment/clearance) to those SPECIFIC OARs."
    }
  },
  required: ["feedback", "nextPhase", "questionToResident"]
};

const SYSTEM_INSTRUCTION = `
You are an expert Radiation Oncology Attending leading a Multidisciplinary Tumor Board simulation.

**Phases:**
1. **Vignette**: Present patient. Generate a 'visualDescription' for the medical illustrator here. 
   - **ILLUSTRATION RULE**: The description MUST be written for a medical illustrator creating a plate for the Netter Atlas. It needs anatomical precision. NOT "a tumor in the lung". BUT "Right lateral thoracotomy view showing a 4cm spiculated mass in the RUL apicoposterior segment, retracting the visceral pleura, adjacent to the azygos vein."
2. **Imaging/Pathology/Staging**: Reveal workup sequentially.
3. **Planning**: Discuss intent, dose, fractionation, OARs.
   - **CRITICAL**: If the resident proposes a dose/fractionation/technique, you MUST ask them to explicitly define the **Intent of Treatment** (Radical, Adjuvant, Palliative) if they haven't already. Do not accept the plan without establishing intent.
   - **DYNAMIC OAR ILLUSTRATION**: When the resident mentions specific Organs At Risk (OARs) (e.g., "optic chiasm", "rectum", "brainstem"), you **MUST** generate a new 'visualDescription'.
     - This new description should be a zoomed-in anatomical view (often Axial/Cross-sectional) specifically highlighting the **spatial relationship** between the tumor and those mentioned OARs.
     - Example: "Axial anatomical view through the suprasellar cistern showing a 2cm pituitary macroadenoma compressing the inferior aspect of the optic chiasm, lifting it superiorly. Netter style."
4. **PeerReview**: CRITICAL STEP. After the resident commits to a plan AND intent, switch to this phase.
   - Generate 2 "Simulated Peer Plans" (e.g., from "Resident A" and "Resident B").
   - One plan should be reasonable but maybe slightly different (e.g., different fractionation).
   - One plan should have a minor or major flaw (e.g., missing an OAR, aggressive dose).
   - Ask the user to critique these plans.
5. **Completed**: Final wrap-up.

**Performance Dashboard**:
- Evaluate every user response.
- Provide scores (0-100) for Reasoning, Guideline Adherence, and Safety.
- Log specific guidelines (NCCN/ASTRO) and "Improvement Areas" if they make mistakes.

**Tone**:
- Strict but educational.
- Challenge the resident if they miss OARs or Guidelines.
`;

export const generateNextTurn = async (
  currentPhase: CasePhase,
  currentChart: PatientChartData,
  history: Message[],
  userResponse: string,
  caseType?: string
): Promise<SimulationResponse> => {
  const ai = getClient();

  const promptContext = `
    Current Phase: ${currentPhase}
    Current Patient Chart Data: ${JSON.stringify(currentChart)}
    Case Type Requested (if start): ${caseType || 'Random High Yield'}
    
    User's Latest Response: "${userResponse}"
    
    Instruction: 
    - Advance phase only if the user satisfies the current step.
    - If in Planning and user gives a solid plan, move to PeerReview and generate peerPlans.
    - If in PeerReview and user critiques well, move to Completed.
    - Update performance metrics based on this specific turn.
  `;

  const formattedHistory = history
    .filter(m => m.role !== 'system')
    .filter((m, index) => {
       const isLast = index === history.length - 1;
       if (isLast && m.role === 'user' && m.content === userResponse) return false;
       return true;
    })
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user', 
      parts: [{ text: m.content }]
    }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: promptContext }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4, 
      }
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    jsonText = jsonText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    
    return JSON.parse(jsonText) as SimulationResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process simulation turn. Please check your connection and API key.");
  }
};

export const generateMedicalIllustration = async (visualDescription: string): Promise<string> => {
  const ai = getClient();
  
  // Refined prompt for Netter-style accuracy
  const prompt = `Generate a highly accurate medical illustration in the exact style of Frank Netter (The CIBA Collection of Medical Illustrations).
  
  **Anatomical Subject**: ${visualDescription}
  
  **Style Specifications**:
  1.  **Technique**: Realistic watercolor and gouache with precise ink outlines.
  2.  **Color Palette**: Use the classic Netter palette (visceral reds, ligamentous creams, fascial greys, nerve yellows).
  3.  **Accuracy**: Anatomically perfect. Muscle insertions, vessel pathways, and organ relationships must be textbook-accurate.
  4.  **Composition**: Educational atlas view. Clean separation of structures. 
  5.  **Background**: Pure white or very light off-white paper texture.
  6.  **Pathology**: The tumor/lesion should be clearly distinguishable but realistically integrated into the tissue (not a cartoon blob).
  
  **Negative Constraints**:
  - No text, labels, arrows, or leaders.
  - No photorealistic digital 3D render style.
  - No dark/black backgrounds.
  - No blur or depth-of-field effects; keep everything in sharp educational focus.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "4:3" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Gen Error:", error);
    return "";
  }
};