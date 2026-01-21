
export const suggestVersionAndReleaseNotes = async (
  currentVersion: string,
  changeDescription: string
) => {
  try {
    const response = await fetch('/.netlify/functions/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentVersion, changeDescription }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI suggestion');
    }

    return await response.json();
  } catch (error) {
    console.error("AI suggestion error:", error);
    return null;
  }
};
