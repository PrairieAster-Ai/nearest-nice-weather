export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{color: '#7563A8'}}>
          Terms & Conditions
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> December 2024
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing and using Nearest Nice Weather ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            2. Service Description
          </h2>
          <p className="mb-4">
            Nearest Nice Weather is a weather intelligence platform that helps users find locations with optimal weather conditions for outdoor activities. We provide weather data, location information, and links to tourism resources.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            3. Weather Data Disclaimer
          </h2>
          <p className="mb-4">
            Weather information is provided for informational purposes only. We are not responsible for the accuracy of weather data or any decisions made based on this information. Always check official weather sources before making travel or outdoor activity plans.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            4. Third-Party Links
          </h2>
          <p className="mb-4">
            Our service contains links to third-party websites including ExploreMinnesota.com, Minnesota DNR, and local tourism operators. We are not responsible for the content or practices of these external sites.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            5. Limitation of Liability
          </h2>
          <p className="mb-4">
            PrairieAster.Ai and Nearest Nice Weather shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of this service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4" style={{color: '#7563A8'}}>
            6. Contact Information
          </h2>
          <p className="mb-4">
            For questions about these Terms & Conditions, please contact us through our website at{' '}
            <a href="https://prairieaster.ai" className="text-blue-600 hover:underline">
              PrairieAster.Ai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}