import { ArrowRight, Users, IndianRupee, BarChartBig } from 'lucide-react'; // Example icons from lucide-react

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900"> {/* Base background for the whole page */}
      {/* Pre-header / Top bar */}
      <div className="bg-slate-800 text-center py-2.5 px-4 text-xs sm:text-sm text-slate-200">
        Seamless UPI Integration
      </div>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 pt-10 pb-16 md:p-10 md:pt-16 md:pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl leading-tight sm:text-5xl md:text-6xl font-bold mb-5 sm:mb-6">
            Split Expenses, Not Friendships.
          </h1>
          <p className="text-md sm:text-lg md:text-xl text-slate-300 mb-8 sm:mb-10 max-w-xs sm:max-w-md md:max-w-2xl mx-auto">
            Effortlessly manage group expenses, track every contribution, and settle up with instant UPI payments.
            <span className="block mt-2 sm:mt-1">Perfect for <strong className="text-blue-400">roommates</strong>, <strong className="text-blue-400">travel buddies</strong>, and <strong className="text-blue-400">teams</strong>.</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10 sm:mb-12">
            <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 sm:px-8 rounded-lg text-base sm:text-lg inline-flex items-center justify-center transition duration-150 ease-in-out">
              Create Your First Room <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="w-full sm:w-auto bg-transparent hover:bg-slate-700 text-slate-200 font-semibold py-3 px-6 sm:px-8 rounded-lg text-base sm:text-lg border border-slate-600 hover:border-slate-500 transition duration-150 ease-in-out">
              Learn More
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-slate-300">
            <div className="flex flex-col items-center p-3">
              <IndianRupee className="h-7 w-7 sm:h-8 sm:w-8 mb-1.5 text-blue-400" />
              <span className="text-xl sm:text-2xl font-bold">10L+</span>
              <span className="text-xs sm:text-sm">INR Managed</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <Users className="h-7 w-7 sm:h-8 sm:w-8 mb-1.5 text-blue-400" />
              <span className="text-xl sm:text-2xl font-bold">500+</span>
              <span className="text-xs sm:text-sm">Active Rooms</span>
            </div>
            <div className="flex flex-col items-center p-3">
              {/* Using a generic "happy user" icon placeholder, replace if you have a better one */}
              <BarChartBig className="h-7 w-7 sm:h-8 sm:w-8 mb-1.5 text-blue-400" />
              <span className="text-xl sm:text-2xl font-bold">2K+</span>
              <span className="text-xs sm:text-sm">Happy Users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder for the next section (e.g., Features) */}
      {/* <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Features Section Coming Soon...</h2>
        </div>
      </section> */}
    </div>
  );
}