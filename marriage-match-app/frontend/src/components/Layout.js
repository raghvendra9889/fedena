import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Favorite,
  Search,
  Message,
  Person,
  Settings,
  Logout,
  Dashboard,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { messageAPI } from '../services/api';
import { useQuery } from 'react-query';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  // Get unread message count
  const { data: unreadData } = useQuery(
    'unreadCount',
    () => messageAPI.getUnreadCount(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const unreadCount = unreadData?.data?.count || 0;

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const navigationItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { label: 'Discover', icon: <Search />, path: '/discover' },
    { label: 'Matches', icon: <Favorite />, path: '/matches' },
    { 
      label: 'Messages', 
      icon: unreadCount > 0 ? <Badge badgeContent={unreadCount} color="error"><Message /></Badge> : <Message />, 
      path: '/messages' 
    },
    { label: 'Profile', icon: <Person />, path: '/profile' },
  ];

  const getCurrentNavValue = () => {
    const currentPath = location.pathname;
    const navItem = navigationItems.find(item => currentPath.startsWith(item.path));
    return navItem ? navigationItems.indexOf(navItem) : 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                flexGrow: 1, 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              💕 Marriage Match
            </Typography>
          </motion.div>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar 
                src={user?.profileImage} 
                alt={user?.firstName}
                sx={{ width: 32, height: 32 }}
              >
                {user?.firstName?.charAt(0)}
              </Avatar>
            </IconButton>
          </motion.div>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <Person sx={{ mr: 1 }} />
          My Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <Settings sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px', // AppBar height
          pb: isMobile ? '56px' : 0, // BottomNavigation height on mobile
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ height: '100%' }}
        >
          <Outlet />
        </motion.div>
      </Box>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <BottomNavigation
          value={getCurrentNavValue()}
          onChange={(event, newValue) => {
            navigate(navigationItems[newValue].path);
          }}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.drawer + 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: 'white',
              },
            },
          }}
        >
          {navigationItems.map((item, index) => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
};

export default Layout;