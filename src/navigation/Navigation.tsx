import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import HomeThreeMain from '../pages/HomeThreeMain';
import SearchResultsMain from '../pages/SearchResultsMain';
import PackageDetailsMain from '../pages/PackageDetailsMain';
import AgentProfileMain from '../pages/AgentProfileMain';
import QuoteViewMain from '../pages/QuoteViewMain';
// Kept as the markup donor for the package-detail page in the next step.
import TourDetailsOneMain from '../pages/TourDetailsOneMain';
import AboutMain from '../pages/AboutMain';
import PricingMain from '../pages/PricingMain';
import FaqMain from '../pages/FaqMain';
import LogInMain from '../pages/LogInMain';
import RegisterMain from '../pages/RegisterMain';
import BlogOneMain from '../pages/BlogOneMain';
import BlogTwoMain from '../pages/BlogTwoMain';
import BlogDetailsMain from '../pages/BlogDetailsMain';
import ContactMain from '../pages/ContactMain';
import LegalPageMain from '../pages/LegalPageMain';
import ErrorMain from '../pages/ErrorMain';
import DashboardMain from '../pages/DashboardMain';
import AgentDashboardMain from '../pages/AgentDashboardMain';
import ProfileMain from '../pages/ProfileMain';
import AdminRoute from '../components/common/AdminRoute';
import AgentRoute from '../components/common/AgentRoute';
import ProtectedRoute from '../components/common/ProtectedRoute';

const AppNavigation = () => {
  return (
    <Router>
      <Routes>
        {/* Public marketplace */}
        <Route path="/" element={<HomeThreeMain />} />
        <Route path="/search" element={<SearchResultsMain />} />
        <Route path="/packages/:id" element={<PackageDetailsMain />} />
        <Route path="/agents/:id" element={<AgentProfileMain />} />
        {/* Reached by link from WhatsApp — deliberately outside any auth guard,
            because the customer has no account. */}
        <Route path="/quote/:token" element={<QuoteViewMain />} />
        <Route path="/tour-details" element={<TourDetailsOneMain />} />
        <Route path="/about" element={<AboutMain />} />
        <Route path="/pricing" element={<PricingMain />} />
        <Route path="/faq" element={<FaqMain />} />
        <Route path="/contact" element={<ContactMain />} />

        {/* Legal / policy pages. /legal/:slug serves whatever an admin has
            published, so a new policy needs no route; /terms and /privacy are
            kept as stable, linkable shortcuts to the two standard ones. */}
        <Route path="/terms" element={<LegalPageMain slug="terms-and-conditions" fallbackTitle="Terms & Conditions" />} />
        <Route path="/privacy" element={<LegalPageMain slug="privacy-policy" fallbackTitle="Privacy Policy" />} />
        <Route path="/legal/:slug" element={<LegalPageMain />} />

        {/* Content */}
        <Route path="/blog-grid" element={<BlogOneMain />} />
        <Route path="/blog-standard" element={<BlogTwoMain />} />
        <Route path="/blog-details" element={<BlogDetailsMain />} />

        {/* Auth */}
        <Route path="/login" element={<LogInMain />} />
        <Route path="/register" element={<RegisterMain />} />

        {/* Authenticated areas */}
        <Route path="/dashboard" element={
          <AdminRoute>
            <DashboardMain />
          </AdminRoute>
        } />
        <Route path="/agent-dashboard" element={
          <AgentRoute>
            <AgentDashboardMain />
          </AgentRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileMain />
          </ProtectedRoute>
        } />

        <Route path="*" element={<ErrorMain />} />
      </Routes>
    </Router>
  );
};

export default AppNavigation;
