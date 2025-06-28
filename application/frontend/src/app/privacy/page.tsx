export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{color: '#7563A8'}}>
          Privacy Policy
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> December 2024
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            1. Information We Collect
          </h2>
          <p className="mb-4">
            We collect minimal information to provide our weather intelligence service:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Location data when you choose to share it for weather searches</li>
            <li>Basic usage analytics to improve our service</li>
            <li>Browser information for technical optimization</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            2. How We Use Your Information
          </h2>
          <p className="mb-4">
            We use collected information to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Provide weather data for your requested locations</li>
            <li>Improve our service and user experience</li>
            <li>Display relevant tourism information and local maker advertisements</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            3. Information Sharing
          </h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties, except:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>When you click links to external tourism websites (subject to their privacy policies)</li>
            <li>For analytics services that help us improve our platform</li>
            <li>When required by law or to protect our rights</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            4. Cookies and Tracking
          </h2>
          <p className="mb-4">
            We use essential cookies to provide our service and may use analytics cookies to understand usage patterns. You can control cookie settings in your browser.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            5. Third-Party Services
          </h2>
          <p className="mb-4">
            Our service integrates with weather APIs and Minnesota tourism resources. These services have their own privacy policies that govern data collection when you interact with them.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            6. Data Security
          </h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your information. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            7. Contact Us
          </h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="https://prairieaster.ai" className="text-blue-600 hover:underline">
              PrairieAster.Ai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}