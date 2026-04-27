import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveNotifications } from '@/socket/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fetchNotifications, markNotificationRead } from '@/api/notifications';
import type { Notification as AppNotification } from '@/types/quiz';
import { LogOut, Plus, LayoutDashboard, BookOpen, Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';
import { useCallback } from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { toast } = useToast();

  const { unreadCount, latestNotification, decrementUnread } = useLiveNotifications(isAuthenticated);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
    } catch {
      toast({
        title: 'Could not load notifications',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNotifications(false);
    }
  }, [toast]);

  useEffect(() => {
    if (latestNotification) {
      toast({
        title: latestNotification.title,
        description: latestNotification.message || undefined,
      });
    }
  }, [latestNotification, toast]);

  useEffect(() => {
    if (notificationsOpen && latestNotification) {
      void loadNotifications();
    }
  }, [notificationsOpen, latestNotification, loadNotifications]);

  const openNotifications = (open: boolean) => {
    setNotificationsOpen(open);
    if (open) {
      void loadNotifications();
    }
  };

  const formatNotificationTime = (dateString: string) =>
    new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getQuizIdFromNotification = (notification: AppNotification): string | null => {
    const value = notification.data?.quiz_id;
    return typeof value === 'string' ? value : null;
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications(prev =>
          prev.map(item =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
        decrementUnread();
      } catch {
        toast({
          title: 'Could not mark notification as read',
          variant: 'destructive',
        });
      }
    }

    const quizId = getQuizIdFromNotification(notification);
    if (quizId) {
      navigate(`/quiz/${quizId}/analytics`);
      setNotificationsOpen(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-quizzes', label: 'My Quizzes', icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">Q</span>
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">Fast-q</span>
          </Link>

          {isAuthenticated && (
            <>
              <nav className="hidden items-center gap-1 md:flex">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to}>
                    <Button variant={isActive(link.to) ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </nav>

              <div className="hidden items-center gap-3 md:flex">
                <Button size="sm" onClick={() => navigate('/create-quiz')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Quiz
                </Button>
                <Popover open={notificationsOpen} onOpenChange={openNotifications}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="end">
                    <div className="border-b px-4 py-3">
                      <p className="font-semibold">Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount} unread
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      {loadingNotifications ? (
                        <p className="p-3 text-sm text-muted-foreground">Loading notifications...</p>
                      ) : notifications.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No notifications yet.</p>
                      ) : (
                        notifications.map(notification => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className={`mb-1 w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/70 ${
                              notification.isRead ? 'bg-background' : 'bg-muted/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium">{notification.title}</p>
                              {!notification.isRead && (
                                <span className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                            )}
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {user?.displayName?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user?.displayName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X /> : <Menu />}
              </Button>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link to="/register"><Button size="sm">Sign up</Button></Link>
            </div>
          )}
        </div>

        {mobileOpen && isAuthenticated && (
          <div className="border-t bg-card p-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                  <Button variant={isActive(link.to) ? 'secondary' : 'ghost'} className="w-full justify-start gap-2">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Button onClick={() => { setMobileOpen(false); navigate('/create-quiz'); }} className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Create Quiz
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { logout(); navigate('/login'); setMobileOpen(false); }}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
};

export default Layout;
