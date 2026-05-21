/* Simple Vercel serverless mock for /api/ai/insights
   Returns cached mock insights to avoid external rate limits during deployment/testing. */
module.exports = async (req, res) => {
  try {
    // Cache for 60s at the edge to reduce request volume
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    const data = {
      generatedAt: new Date().toISOString(),
      source: 'mock',
      summary: {
        atRisk: 23,
        dropoutRisk: 7,
        improvementRate: '+14%',
        feeDefaultRisk: 41
      },
      predictions: [
        { student: 'Priya D (9-A)', predicted: '88%', risk: 'Low' },
        { student: 'Rajan K (8-B)', predicted: '54%', risk: 'High' },
        { student: 'Meena T (9-A)', predicted: '72%', risk: 'Medium' },
        { student: 'Arjun K (9-A)', predicted: '81%', risk: 'Low' },
        { student: 'Suresh P (6-C)', predicted: '48%', risk: 'Critical' }
      ]
    };

    return res.status(200).json(data);
  } catch (err) {
    console.error('insights handler error:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
};
