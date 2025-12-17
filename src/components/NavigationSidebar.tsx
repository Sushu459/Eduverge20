import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  PlusCircle,
  Home,
  FileText,
  Calculator,
  Sparkles,
  User as UserIcon,
  Lock,
  BarChart3,
  Users,
  
} from 'lucide-react';
import { signOut } from '../utils/auth';
import type { User } from '../utils/supabaseClient';




interface NavigationSidebarProps {
  user: User;
}



const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();



  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };



  const isActive = (path: string) => location.pathname === path;



  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">EduVerge</h1>
        </div>
        <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
        <p className="text-xs text-gray-500 capitalize mt-1">
           {user.role === 'admin' 
            ? '🔐 Admin' 
            : user.role === 'faculty' 
            ? '👨‍🏫 Faculty' 
            : '👨‍🎓 Student'}
        </p>
      </div>



      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Dashboard */}
        {/* <Link
          to="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
            isActive('/')
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Dashboar</span>
        </Link> */}
          


          {/* amin navigation */}
          {user.role === 'admin' && (
  <>
    <Link
      to="/admin/dashboard"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        isActive('/admin/dashboard')
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <BarChart3 className="w-5 h-5" />
      <span>Admin Dashboard</span>
    </Link>

    <Link
      to="/admin/users"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        isActive('/admin/users')
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <Users className="w-5 h-5" />
      <span>User Management</span>
    </Link>

    <Link
      to="/admin/submissions"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        isActive('/admin/submissions')
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <FileText className="w-5 h-5" />
      <span>View Submissions</span>
    </Link>

    <Link
      to="/admin/analytics"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        isActive('/admin/analytics')
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <BarChart3 className="w-5 h-5" />
      <span>Analytics</span>
    </Link>
  </>
)}



        {/* Faculty Navigation */}
        {user.role === 'faculty' && (
          <>
          <Link
          to="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
            isActive('/faculty/dashboard')
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Dashboar</span>
        </Link>
            <Link
              to="/create-assessment"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive('/create-assessment')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Assessment</span>
            </Link>



            <Link
              to="/course-materials"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive('/course-materials')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Course Materials</span>
            </Link>
          </>
        )}



        {/* Student Navigation */}
        {user.role === 'student' && (
          <>

          <Link
          to="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
            isActive('/faculty/dashboard')
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Dashboar</span>
        </Link>
        
            <Link
              to="/courses"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive('/courses')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Course Materials</span>
            </Link>


            {/* Score Calculator Link */}
            <Link
              to="/score-calculator"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive('/score-calculator')
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Calculator className="w-5 h-5" />
              <span>Score Calculator</span>
            </Link>


            {/* AI Assistant Link */}
            <Link
              to="/ai-assistant"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive('/ai-assistant')
                  ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700'
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Assistant</span>
            </Link>
          </>
        )}



        {/* Divider for Settings */}
        <div className="my-4 h-px bg-gray-200"></div>



        {/* Settings Section */}
        <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2">Settings</div>


        {/* My Profile */}
        <Link
          to="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
            isActive('/profile')
              ? 'bg-green-100 text-green-700'
              : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>My Profile</span>
        </Link>



        {/* Change Password */}
        <Link
          to="/change-password"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
            isActive('/change-password')
              ? 'bg-orange-100 text-orange-700'
              : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
          }`}
        >
          <Lock className="w-5 h-5" />
          <span>Change Password</span>
        </Link>



        
      </nav>



      {/* Divider */}
      <div className="mx-4 h-px bg-gray-200"></div>



      {/* Sign Out */}
      <div className="p-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};



export default NavigationSidebar;
