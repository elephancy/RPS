import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageShell from './components/PageShell';
import CookieConsent from './components/CookieConsent';
import RouteMetadata from './components/RouteMetadata';

import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { LoadingState } from './components/ui/page';

const Home = lazy(() => import('./pages/core/Home'));
const Rules = lazy(() => import('./pages/core/Rules'));
const AuthForm = lazy(() => import('./pages/core/AuthForm'));
const VerifyEmail = lazy(() => import('./pages/core/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/core/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/core/ResetPassword'));
const Onboarding = lazy(() => import('./pages/core/Onboarding'));
const Privacy = lazy(() => import('./pages/core/Privacy'));
const Cookies = lazy(() => import('./pages/core/Cookies'));
const PublicProfile = lazy(() => import('./pages/user/PublicProfile'));
const Dashboard = lazy(() => import('./pages/user/Dashboard'));
const Leaderboard = lazy(() => import('./pages/features/Leaderboard'));
const Admin = lazy(() => import('./pages/core/AdminPanel'));
const Bets = lazy(() => import('./pages/bets/Bets'));
const Parlay = lazy(() => import('./pages/bets/Parlay'));
const Profile = lazy(() => import('./pages/user/Profile'));
const Achievements = lazy(() => import('./pages/user/Achievements'));
const Tasks = lazy(() => import('./pages/features/Tasks'));
const Store = lazy(() => import('./pages/features/Store'));
const Service = lazy(() => import('./pages/features/Service'));
const EconomyHub = lazy(() => import('./pages/features/EconomyHub'));
const Market = lazy(() => import('./pages/market/Market'));
const Games = lazy(() => import('./pages/games/Games'));
const AdvancedArcade = lazy(() => import('./pages/games/AdvancedArcade'));
const Spinner = lazy(() => import('./pages/games/Spinner'));
const Minefield = lazy(() => import('./pages/games/Minefield'));
const Casino = lazy(() => import('./pages/games/Casino'));
const ClickFrenzy = lazy(() => import('./pages/games/ClickFrenzy'));
const RPS = lazy(() => import('./pages/games/RPS'));
const PuzzleRush = lazy(() => import('./pages/games/PuzzleRush'));
const SanctuaryPage = lazy(() => import('./pages/virtual-pet/SanctuaryPage'));
const GachaPage = lazy(() => import('./pages/virtual-pet/GachaPage'));
const PetShop = lazy(() => import('./pages/virtual-pet/PetShop'));
const BreedingPage = lazy(() => import('./pages/virtual-pet/BreedingPage'));
const NotFound = lazy(() => import('./pages/core/NotFound'));
const BetRequest = lazy(() => import('./pages/bets/BetRequest'));

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3200,
          style: {
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(8,13,28,0.92)',
            color: '#f8fafc',
            borderRadius: '18px',
            boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(18px)'
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#052e16'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#450a0a'
            }
          }
        }}
      />
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Router>
            <RouteMetadata />
            <Navbar />
            <Suspense fallback={<LoadingState label="Loading page" />}>
              <Routes>
                <Route element={<PageShell />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/login" element={<AuthForm isLogin={true} />} />
                  <Route path="/register" element={<AuthForm isLogin={false} />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/profile/:username" element={<PublicProfile />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requireStaff><Admin /></ProtectedRoute>} />
                  <Route path="/bets" element={<ProtectedRoute><Bets /></ProtectedRoute>} />
                  <Route path="/bets/parlay" element={<ProtectedRoute><Parlay /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
                  <Route path="/services" element={<ProtectedRoute><Service /></ProtectedRoute>} />
                  <Route path="/economy" element={<ProtectedRoute><EconomyHub /></ProtectedRoute>} />
                  <Route path="/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
                  <Route path="/investments" element={<ProtectedRoute><Market /></ProtectedRoute>} />
                  <Route path="/requests/bets" element={<ProtectedRoute><BetRequest /></ProtectedRoute>} />
                  <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                  <Route path="/games/advanced-arcade" element={<ProtectedRoute><AdvancedArcade /></ProtectedRoute>} />
                  <Route path="/games/spinner" element={<ProtectedRoute><Spinner /></ProtectedRoute>} />
                  <Route path="/games/minefield" element={<ProtectedRoute><Minefield /></ProtectedRoute>} />
                  <Route path="/games/casino" element={<ProtectedRoute><Casino /></ProtectedRoute>} />
                  <Route path="/games/click-frenzy" element={<ProtectedRoute><ClickFrenzy /></ProtectedRoute>} />
                  <Route path="/games/rps" element={<ProtectedRoute><RPS /></ProtectedRoute>} />
                  <Route path="/games/puzzle-rush" element={<ProtectedRoute><PuzzleRush /></ProtectedRoute>} />
                  <Route path="/games/virtual-pet" element={<ProtectedRoute><SanctuaryPage /></ProtectedRoute>} />
                  <Route path="/games/virtual-pet/gacha" element={<ProtectedRoute><GachaPage /></ProtectedRoute>} />
                  <Route path="/games/virtual-pet/shop" element={<ProtectedRoute><PetShop /></ProtectedRoute>} />
                  <Route path="/games/virtual-pet/breeding" element={<ProtectedRoute><BreedingPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
            <Footer />
            <CookieConsent />
          </Router>
        </div>
      </AuthProvider>
    </>
  );
}

export default App;
