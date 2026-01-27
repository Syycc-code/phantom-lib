// API Interface
export interface Paper {
  id: number;
  title: string;
  author: string;
  year: string;
  abstract?: string;
  shadow_problem?: string;
  persona_solution?: string;
  weakness_flaw?: string;
}

export const API = {
  // Fetch all papers
  getPapers: async (): Promise<Paper[]> => {
    const res = await fetch('/api/papers');
    if (!res.ok) throw new Error('Failed to fetch papers');
    return res.json();
  },

  // Steal Heart (Add Paper via URL)
  stealPaper: async (url: string): Promise<Paper> => {
    const res = await fetch('/api/steal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Infiltration Failed');
    return res.json();
  },

  // Third Eye (DeepSeek Analyze)
  activateThirdEye: async (paperId: number): Promise<Paper> => {
    const res = await fetch('/api/third_eye', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: paperId }),
    });
    if (!res.ok) throw new Error('Third Eye Blinded');
    return res.json();
  }
};
