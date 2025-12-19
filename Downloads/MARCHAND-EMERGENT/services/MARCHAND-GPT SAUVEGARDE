import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

// Read API key from Vite env. In browser we must use import.meta.env.*
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Lazy initialize client only if key is present to avoid runtime crash
const getClient = () => {
  if (!GEMINI_API_KEY) {
    throw new Error("Aucune cle GEMINI (VITE_GEMINI_API_KEY) n'est definie");
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

const URBAN_PLANNER_SYSTEM_INSTRUCTION = `
Tu es un expert en urbanisme et en montage d'opérations immobilières travaillant pour un marchand de biens professionnel.
Ta mission est de réaliser une analyse réglementaire complète basée sur une adresse donnée.

Tu dois croiser les informations trouvées via Google Search (PLU, PLUi-HD, Zonage, Cadastre, Risques) pour livrer un diagnostic précis.

STRUCTURE DE LA RÉPONSE ATTENDUE :

### 1. 🧭 ZONAGE & PLUi-HD
*   **Zone exacte** : Identifier la zone (ex: UA, UB, 1AU) selon le PLU/PLUi-HD en vigueur.
*   **Vocation de la zone** : Résidentiel, mixte, activité, naturel ?

### 2. 📜 RÈGLES D'URBANISME (PLU / PLUi-HD)
*   **Hauteur max** : (Au faîtage / à l'égout).
*   **Emprise au sol** : CES (Coefficient d'Emprise au Sol).
*   **Implantation** : Retrait par rapport à la rue et aux limites séparatives.
*   **Stationnement** : Obligations par logement créé.
*   **Espaces verts** : Pourcentage de pleine terre obligatoire.

### 3. 🧱 ÉTUDE DE FAISABILITÉ CONDITIONNÉE
*   **Analyse de la parcelle** : Forme, accès, topographie (si info dispo).
*   **Potentiel de division** : Est-il possible de détacher un lot à bâtir vu les règles de façade/accès ?
*   **Changement de destination** : Autorisé ou interdit dans cette zone ?
*   **Surélévation/Extension** : Faisable selon le gabarit enveloppe ?

### 4. 🚧 CONTRAINTES & SERVITUDES
*   Périmètre ABF (Architecte des Bâtiments de France).
*   PPRI (Zone inondable).
*   Droit de préemption urbain.

### 5. 💡 VERDICT OPÉRATIONNEL & RECOMMANDATIONS
Termine par un verdict clair :
✅ **Favorable** : (Expliquer pourquoi)
⚠️ **Mitigé / Conditionné** : (Lister les conditions suspensives à prévoir)
❌ **Bloquant** : (Règle rédhibitoire identifiée)

Références consultées : 🗃️ [Liste des sources]
`;

export const analyzeUrbanism = async (address: string): Promise<AnalysisResult> => {
  try {
    const client = getClient();
    const model = "gemini-2.5-flash"; // Using Flash for speed + Search capability
    
    const prompt = `
    Réalise une étude de faisabilité conditionnée par le zonage exact de la parcelle et le respect des règles du PLUi-HD pour le bien situé à : ${address}.
    
    Concentre-toi sur :
    1. L'identification précise du document d'urbanisme (PLU ou PLUi-HD).
    2. Les règles morphologiques (Gabarit, Hauteur, Emprise).
    3. La faisabilité concrète d'une division parcellaire ou d'une densification.
    
    Sois technique et précis pour un usage professionnel.
    `;

    const response = await client.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: URBAN_PLANNER_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Critical for retrieving real PLU data
        temperature: 0.3, // Lower temperature for more rigorous adherence to rules
      },
    });

    const text = response.text || "Erreur: Aucune analyse générée.";
    
    // Extract grounding chunks for sources if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((c: any) => c.web)
      .filter((w: any) => w)
      .map((w: any) => ({ uri: w.uri, title: w.title }));

    return { markdown: text, sources };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);

    // Friendly fallback content in dev to avoid blank page when key missing
    const friendlyMarkdown = `⚠️ Mode demo: ajoute VITE_GEMINI_API_KEY dans un fichier .env.local a la racine pour activer l'analyse IA.\n\nAdresse testee: ${address}`;

    return { 
      markdown: friendlyMarkdown,
      sources: []
    };
  }
};